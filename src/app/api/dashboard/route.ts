import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Provider from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';
import Lead from '@/models/Lead';
import Service from '@/models/Service';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await connectDB();

    // Automatically seed if empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await seedDatabase();
    }

    const providers = await Provider.find({}).sort({ name: 1 });
    const services = await Service.find({}).sort({ name: 1 });

    // Fetch all assignments and populate Lead and Service details
    const assignments = await LeadAssignment.find({})
      .populate({
        path: 'leadId',
        model: Lead,
        populate: {
          path: 'serviceId',
          model: Service,
        },
      })
      .sort({ assignedAt: -1 });

    // Map assignments by provider for easy display
    const providerAssignments = providers.map((provider) => {
      const providerLeads = assignments
        .filter((asg) => asg.providerId.toString() === provider._id.toString())
        .map((asg: any) => {
          const lead = asg.leadId;
          return {
            assignmentId: asg._id,
            assignedAt: asg.assignedAt,
            leadId: lead ? lead._id : null,
            name: lead ? lead.name : 'Unknown',
            phone: lead ? lead.phone : 'Unknown',
            city: lead ? lead.city : 'Unknown',
            description: lead ? lead.description : '',
            service: lead && lead.serviceId ? lead.serviceId.name : 'Unknown',
          };
        });

      return {
        _id: provider._id,
        name: provider.name,
        monthlyQuota: provider.monthlyQuota,
        leadsReceivedCount: provider.leadsReceivedCount,
        remainingQuota: Math.max(0, provider.monthlyQuota - provider.leadsReceivedCount),
        active: provider.active,
        leads: providerLeads,
      };
    });

    // Also get all unique leads for a global log
    const allLeads = await Lead.find({})
      .populate('serviceId')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      providers: providerAssignments,
      services,
      leads: allLeads.map((l: any) => ({
        _id: l._id,
        name: l.name,
        phone: l.phone,
        city: l.city,
        service: l.serviceId ? l.serviceId.name : 'Unknown',
        description: l.description,
        createdAt: l.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
