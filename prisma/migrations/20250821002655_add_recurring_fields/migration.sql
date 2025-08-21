-- AlterTable
ALTER TABLE "mitzvah_requests" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentRequestId" TEXT,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceInterval" INTEGER,
ADD COLUMN     "recurrenceType" TEXT;

-- AddForeignKey
ALTER TABLE "mitzvah_requests" ADD CONSTRAINT "mitzvah_requests_parentRequestId_fkey" FOREIGN KEY ("parentRequestId") REFERENCES "mitzvah_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
