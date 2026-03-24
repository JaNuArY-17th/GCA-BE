// import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// export class AddHasVotedToVoters1710000000000 implements MigrationInterface {
//   name = 'AddHasVotedToVoters1710000000000';

//   public async up(queryRunner: QueryRunner): Promise<void> {
//     const hasHasVoted = await queryRunner.hasColumn('voters', 'hasVoted');
//     if (!hasHasVoted) {
//       await queryRunner.addColumn(
//         'voters',
//         new TableColumn({
//           name: 'hasVoted',
//           type: 'boolean',
//           isNullable: false,
//           default: false,
//         }),
//       );
//     }

//     // Standardize existing MSSV values to uppercase + trimmed
//     await queryRunner.query(
//       `UPDATE voters SET "mssv" = UPPER(TRIM("mssv")) WHERE "mssv" IS NOT NULL`,
//     );
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     const hasHasVoted = await queryRunner.hasColumn('voters', 'hasVoted');
//     if (hasHasVoted) {
//       await queryRunner.dropColumn('voters', 'hasVoted');
//     }
//   }
// }
