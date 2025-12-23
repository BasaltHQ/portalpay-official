import { loadEnv } from '../config/load-env';
import { connectDB } from './connection';
import { InventoryItem } from '../models/InventoryItem';
import { TeamMember } from '../models/TeamMember';
import { Analytics } from '../models/Analytics';
import { User } from '../models/User';
import PerformanceEntry from '../models/PerformanceEntry';

export async function seedSampleData() {
  try {
    loadEnv();
    console.log('🌱 Seeding sample data...');
    await connectDB();

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ email: 'admin@ledgerone.demo' });
    const adminId = adminUser?._id;

    // Clear existing data
    await InventoryItem.deleteMany({});
    await TeamMember.deleteMany({});
    await Analytics.deleteMany({});
    await PerformanceEntry.deleteMany({});

    // Sample Inventory Items
    const inventoryItems = [
      {
        name: 'Tomatoes',
        description: 'Fresh red tomatoes',
        category: 'Vegetables',
        currentStock: 50,
        minThreshold: 10,
        maxCapacity: 100,
        unit: 'kg',
        costPerUnit: 2.50,
        supplier: 'Fresh Farms Co.',
        location: 'Cold Storage A',
        status: 'normal',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdBy: adminId
      },
      {
        name: 'Chicken Breast',
        description: 'Premium chicken breast',
        category: 'Proteins',
        currentStock: 25,
        minThreshold: 15,
        maxCapacity: 50,
        unit: 'kg',
        costPerUnit: 8.99,
        supplier: 'Quality Meats Ltd.',
        location: 'Freezer B',
        status: 'normal',
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        createdBy: adminId
      },
      {
        name: 'Olive Oil',
        description: 'Extra virgin olive oil',
        category: 'Pantry',
        currentStock: 8,
        minThreshold: 12,
        maxCapacity: 30,
        unit: 'bottles',
        costPerUnit: 12.99,
        supplier: 'Mediterranean Imports',
        location: 'Pantry Shelf 3',
        status: 'low',
        createdBy: adminId
      },
      {
        name: 'Pasta',
        description: 'Spaghetti pasta',
        category: 'Pantry',
        currentStock: 3,
        minThreshold: 10,
        maxCapacity: 40,
        unit: 'kg',
        costPerUnit: 1.99,
        supplier: 'Italian Foods Co.',
        location: 'Dry Storage',
        status: 'critical',
        createdBy: adminId
      },
      {
        name: 'Fresh Basil',
        description: 'Organic fresh basil',
        category: 'Spices',
        currentStock: 15,
        minThreshold: 5,
        maxCapacity: 20,
        unit: 'bunches',
        costPerUnit: 1.50,
        supplier: 'Herb Garden Supplies',
        location: 'Fresh Herb Cooler',
        status: 'normal',
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        createdBy: adminId
      }
    ];

    await InventoryItem.insertMany(inventoryItems);
    console.log('✅ Sample inventory items created');

    // Sample Team Members
    const teamMembers = [
      {
        name: 'Sarah Johnson',
        role: 'Head Chef',
        email: 'sarah.johnson@ledgerone.demo',
        phone: '+1-555-0101',
        department: 'Kitchen',
        joinDate: new Date('2023-01-15'),
        hourlyRate: 28.50,
        status: 'active',
        skills: ['French Cuisine', 'Menu Planning', 'Team Leadership'],
        toastId: 'toast-sarah-001'
      },
      {
        name: 'Mike Rodriguez',
        role: 'Sous Chef',
        email: 'mike.rodriguez@ledgerone.demo',
        phone: '+1-555-0102',
        department: 'Kitchen',
        joinDate: new Date('2023-03-10'),
        hourlyRate: 22.00,
        status: 'active',
        skills: ['Prep Work', 'Grilling', 'Inventory Management'],
        toastId: 'toast-mike-002'
      },
      {
        name: 'Emma Thompson',
        role: 'Server',
        email: 'emma.thompson@ledgerone.demo',
        phone: '+1-555-0103',
        department: 'Front of House',
        joinDate: new Date('2023-06-20'),
        hourlyRate: 15.00,
        status: 'active',
        skills: ['Customer Service', 'Wine Knowledge', 'POS Systems'],
        toastId: 'toast-emma-003'
      },
      {
        name: 'David Kim',
        role: 'Bartender',
        email: 'david.kim@ledgerone.demo',
        phone: '+1-555-0104',
        department: 'Front of House',
        joinDate: new Date('2023-04-05'),
        hourlyRate: 18.50,
        status: 'active',
        skills: ['Mixology', 'Inventory', 'Customer Service'],
        toastId: 'toast-david-004'
      }
    ];

    await TeamMember.insertMany(teamMembers);
    console.log('✅ Sample team members created');

    // Sample Performance Entries with red flags for critical members testing
    const performanceEntries = [
      // Sarah Johnson (Head Chef) - 3 red flags (should be critical)
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-sarah-001', rating: 4, isFlag: true, flagType: 'red', details: 'Late arrival', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-sarah-001', rating: 3, isFlag: true, flagType: 'red', details: 'Poor communication', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-sarah-001', rating: 4, isFlag: true, flagType: 'red', details: 'Inventory error', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },

      // Mike Rodriguez (Sous Chef) - 2 red flags (should be critical)
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-mike-002', rating: 4, isFlag: true, flagType: 'red', details: 'Equipment not cleaned', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-mike-002', rating: 3, isFlag: true, flagType: 'red', details: 'Wrong order preparation', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },

      // Emma Thompson (Server) - 1 red flag (should NOT be critical)
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-emma-003', rating: 4, isFlag: true, flagType: 'red', details: 'Slow service', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },

      // David Kim (Bartender) - 1 yellow flag (should NOT be critical)
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-david-004', rating: 4, isFlag: true, flagType: 'yellow', details: 'Minor delay', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },

      // Regular ratings for other employees
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-sarah-001', rating: 5, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-mike-002', rating: 4, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-emma-003', rating: 5, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { restaurantGuid: 'rest-1', employeeToastGuid: 'toast-david-004', rating: 5, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
    ];

    await PerformanceEntry.insertMany(performanceEntries);
    console.log('✅ Sample performance entries created');

    // Sample Analytics Data
    const analyticsData = [
      {
        revenue: 12500.75,
        orders: 145,
        avgOrderValue: 86.21,
        customerSatisfaction: 4.6,
        tableTurnover: 2.3,
        totalCustomers: 120,
        repeatCustomers: 45,
        averageWaitTime: 12.5,
        staffUtilization: 85.2,
        inventoryValue: 8750.00,
        wastePercentage: 2.8,
        period: 'daily',
        date: new Date()
      },
      {
        revenue: 87500.50,
        orders: 980,
        avgOrderValue: 89.29,
        customerSatisfaction: 4.5,
        tableTurnover: 2.4,
        totalCustomers: 820,
        repeatCustomers: 310,
        averageWaitTime: 13.2,
        staffUtilization: 82.7,
        inventoryValue: 8750.00,
        wastePercentage: 3.1,
        period: 'weekly',
        date: new Date()
      },
      {
        revenue: 350000.25,
        orders: 3850,
        avgOrderValue: 90.91,
        customerSatisfaction: 4.4,
        tableTurnover: 2.2,
        totalCustomers: 3200,
        repeatCustomers: 1280,
        averageWaitTime: 14.1,
        staffUtilization: 80.5,
        inventoryValue: 8750.00,
        wastePercentage: 3.5,
        period: 'monthly',
        date: new Date()
      }
    ];

    await Analytics.insertMany(analyticsData);
    console.log('✅ Sample analytics data created');

    console.log('🎉 Sample data seeding completed successfully!');
    
    return {
      inventoryItems: inventoryItems.length,
      teamMembers: teamMembers.length,
      analytics: analyticsData.length,
      performanceEntries: performanceEntries.length
    };

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSampleData()
    .then((result) => {
      console.log('\n📊 Seeding Summary:');
      console.log(`   • Inventory Items: ${result.inventoryItems}`);
      console.log(`   • Team Members: ${result.teamMembers}`);
      console.log(`   • Analytics Records: ${result.analytics}`);
      console.log(`   • Performance Entries: ${result.performanceEntries}`);
      console.log('\n✅ Ready to test the dashboard!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
} 