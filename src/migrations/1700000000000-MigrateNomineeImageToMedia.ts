// import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// export class MigrateNomineeImageToMedia1700000000000 implements MigrationInterface {
//   name = 'MigrateNomineeImageToMedia1700000000000';

//   public async up(queryRunner: QueryRunner): Promise<void> {
//     const hasImageUrlCamel = await queryRunner.hasColumn('nominees', 'imageUrl');
//     const hasImageUrlSnake = await queryRunner.hasColumn('nominees', 'imageurl');
//     const hasImageUrl = hasImageUrlCamel || hasImageUrlSnake;
//     const hasMetadata = await queryRunner.hasColumn('nominees', 'metadata');

//     if (!hasImageUrl && !hasMetadata) {
//       return;
//     }

//     const columns = ['id'];
//     if (hasImageUrlCamel) columns.push('"imageUrl"');
//     else if (hasImageUrlSnake) columns.push('imageurl');
//     if (hasMetadata) columns.push('metadata');

//     const nominees: Array<{ id: string; imageUrl?: string; imageurl?: string; metadata?: any }> = await queryRunner.query(
//       `SELECT ${columns.join(', ')} FROM nominees`,
//     );
//     const imageUrlField = hasImageUrlCamel ? 'imageUrl' : 'imageurl';

//     const hasMediaNomineeId = await queryRunner.hasColumn('media', 'nomineeId');
//     const hasMediaNomineeIdSnake = await queryRunner.hasColumn('media', 'nominee_id');
//     const hasMediaCreatedAt = await queryRunner.hasColumn('media', 'createdAt');

//     let mediaRelationColumn: string;

//     if (hasMediaNomineeId) {
//       mediaRelationColumn = '"nomineeId"';
//     } else if (hasMediaNomineeIdSnake) {
//       mediaRelationColumn = '"nominee_id"';
//     } else {
//       // Add nomineeId column as nullable for migration first
//       await queryRunner.addColumn(
//         'media',
//         new TableColumn({
//           name: 'nomineeId',
//           type: 'uuid',
//           isNullable: true,
//         }),
//       );
//       mediaRelationColumn = '"nomineeId"';
//     }

//     if (!hasMediaCreatedAt) {
//       await queryRunner.addColumn(
//         'media',
//         new TableColumn({
//           name: 'createdAt',
//           type: 'timestamp',
//           default: 'NOW()',
//           isNullable: false,
//         }),
//       );
//     }

//     for (const nominee of nominees) {
//       let url: string | undefined;
//       let metadata = nominee.metadata;

//       if (hasImageUrl && nominee[imageUrlField]) {
//         url = nominee[imageUrlField] as string;
//       }

//       if (!url && hasMetadata && nominee.metadata) {
//         if (typeof nominee.metadata === 'string') {
//           try {
//             metadata = JSON.parse(nominee.metadata);
//           } catch {
//             metadata = null;
//           }
//         }

//         url = metadata?.url;
//       }

//       if (!url) continue;

//       const filename = metadata?.public_id || null;
//       const mimeType = metadata?.format || null;
//       const size = metadata?.bytes ?? null;

//       await queryRunner.query(
//         `INSERT INTO media (${mediaRelationColumn}, "url", "filename", "mimeType", "size", "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())`,
//         [nominee.id, url, filename, mimeType, size],
//       );
//     }

//     if (await queryRunner.hasColumn('nominees', 'imageUrl')) {
//       await queryRunner.dropColumn('nominees', 'imageUrl');
//     } else if (await queryRunner.hasColumn('nominees', 'imageurl')) {
//       await queryRunner.dropColumn('nominees', 'imageurl');
//     }
//     if (hasMetadata) {
//       await queryRunner.dropColumn('nominees', 'metadata');
//     }
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     const hasImageUrl = await queryRunner.hasColumn('nominees', 'imageUrl');
//     if (!hasImageUrl) {
//       await queryRunner.addColumn(
//         'nominees',
//         new TableColumn({
//           name: 'imageUrl',
//           type: 'text',
//           isNullable: true,
//         }),
//       );
//     }

//     const hasMetadata = await queryRunner.hasColumn('nominees', 'metadata');
//     if (!hasMetadata) {
//       await queryRunner.addColumn(
//         'nominees',
//         new TableColumn({
//           name: 'metadata',
//           type: 'jsonb',
//           isNullable: true,
//         }),
//       );
//     }

//     // NOTE: We do not move data back from media to nominees to avoid complexity.
//   }
// }
