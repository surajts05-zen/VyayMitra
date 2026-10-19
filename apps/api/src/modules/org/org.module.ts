import { Module } from '@nestjs/common';
import { OrgService } from './org.service.js';
import { OrgController } from './org.controller.js';

@Module({
  controllers: [OrgController],
  providers: [OrgService],
  exports: [OrgService],
})
export class OrgModule {}
