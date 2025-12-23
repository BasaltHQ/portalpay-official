import ToastAPIClient from '@/lib/services/toast-api-client';
import ToastEmployee from '@/lib/models/ToastEmployee';
import { connectDB } from '@/lib/db/connection';

export interface SyncEmployeesResult {
  processed: number;
  created: number;
  updated: number;
  errors: number;
}

/**
 * Synchronize employees from Toast for a given restaurant into local DB.
 * One-way sync (Toast -> Local). Preserves local hide flag.
 */
export async function syncEmployeesForRestaurant(restaurantGuid: string, options?: { force?: boolean }): Promise<SyncEmployeesResult> {
  await connectDB();

  const toastClient = new ToastAPIClient();
  const force = options?.force === true;

  const results: SyncEmployeesResult = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
  };

  // Pre-mark all employees for this restaurant as potentially inactive; we'll reactivate those present in Toast
  try {
    await ToastEmployee.updateMany(
      { restaurantGuid },
      { $set: { isActive: false, syncStatus: 'pending' } }
    );
  } catch (preflagErr) {
    console.error('Employee pre-flag error:', preflagErr);
  }

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const toastEmployees = await toastClient.getEmployees(restaurantGuid, page, 100);

    for (const toastEmp of toastEmployees.data) {
      try {
        results.processed++;

        const existingEmployee = await ToastEmployee.findOne({ toastGuid: toastEmp.guid });

        if (existingEmployee) {
          const hasChanges = existingEmployee.modifiedDate.getTime() !== new Date(toastEmp.modifiedDate).getTime() || force;

          if (hasChanges) {
            existingEmployee.firstName = toastEmp.firstName;
            existingEmployee.lastName = toastEmp.lastName;
            existingEmployee.email = toastEmp.email;
            existingEmployee.jobTitles = toastEmp.jobTitles || [];
            existingEmployee.externalId = toastEmp.externalId;
            existingEmployee.modifiedDate = new Date(toastEmp.modifiedDate);
            existingEmployee.deletedDate = toastEmp.deletedDate ? new Date(toastEmp.deletedDate) : undefined;
            existingEmployee.lastSyncDate = new Date();
            existingEmployee.syncStatus = 'synced';
            existingEmployee.syncErrors = [];
            // Derive isActive strictly from server flags
            const deletedDateValue = (toastEmp as { deletedDate?: string }).deletedDate;
            const deletedFlag = (toastEmp as { deletedFlag?: boolean }).deletedFlag === true;
            const archivedFlag = (toastEmp as { archivedFlag?: boolean }).archivedFlag === true;
            existingEmployee.isActive = !(deletedFlag || archivedFlag || (!!deletedDateValue && typeof deletedDateValue === 'string' && !deletedDateValue.includes('1970-01-01')));

            await existingEmployee.save();
            results.updated++;
          } else {
            // Even if no data field changed, reactivate and mark synced so pending ones remain only for missing employees
            const deletedDateValue2 = (toastEmp as { deletedDate?: string }).deletedDate;
            const deletedFlag2 = (toastEmp as { deletedFlag?: boolean }).deletedFlag === true;
            const archivedFlag2 = (toastEmp as { archivedFlag?: boolean }).archivedFlag === true;
            existingEmployee.isActive = !(deletedFlag2 || archivedFlag2 || (!!deletedDateValue2 && typeof deletedDateValue2 === 'string' && !deletedDateValue2.includes('1970-01-01')));
            existingEmployee.syncStatus = 'synced';
            await existingEmployee.save();
          }
        } else {
          const deletedDateValue3 = (toastEmp as { deletedDate?: string }).deletedDate;
          const deletedFlag3 = (toastEmp as { deletedFlag?: boolean }).deletedFlag === true;
          const archivedFlag3 = (toastEmp as { archivedFlag?: boolean }).archivedFlag === true;
          const newEmployee = new ToastEmployee({
            toastGuid: toastEmp.guid,
            restaurantGuid,
            entityType: toastEmp.entityType,
            firstName: toastEmp.firstName,
            lastName: toastEmp.lastName,
            email: toastEmp.email,
            jobTitles: toastEmp.jobTitles || [],
            externalId: toastEmp.externalId,
            createdDate: new Date(toastEmp.createdDate),
            modifiedDate: new Date(toastEmp.modifiedDate),
            deletedDate: deletedFlag3 || archivedFlag3 ? new Date() : (deletedDateValue3 ? new Date(deletedDateValue3) : undefined),
            lastSyncDate: new Date(),
            syncStatus: 'synced',
            // Derive isActive strictly from flags
            isActive: !(deletedFlag3 || archivedFlag3 || (!!deletedDateValue3 && typeof deletedDateValue3 === 'string' && !deletedDateValue3.includes('1970-01-01'))),
            isLocallyDeleted: false,
          });

          await newEmployee.save();
          results.created++;
        }
      } catch (error) {
        console.error('Employee sync error:', error);
        results.errors++;
      }
    }

    hasMore = toastEmployees.hasMore || false;
    page++;
  }

  // Cleanup: mark any employees that remain inactive after sync as deleted (not present in Toast)
  try {
    await ToastEmployee.updateMany(
      { restaurantGuid, isActive: false, syncStatus: 'pending', deletedDate: { $exists: false } },
      { $set: { deletedDate: new Date(), syncStatus: 'synced' } }
    );
  } catch (cleanupErr) {
    console.error('Employee cleanup error:', cleanupErr);
  }

  return results;
}


