import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateExpenseSchema,
  CreateExpenseInput,
  UpdateExpenseSchema,
  UpdateExpenseInput,
  ExpenseFilterQuerySchema,
  ExpenseFilterQuery,
  PresignReceiptUploadSchema,
  PresignReceiptUploadInput,
  ConfirmReceiptUploadSchema,
  ConfirmReceiptUploadInput,
  ConfirmOcrReviewSchema,
  ConfirmOcrReviewInput,
  Role,
  AuthTokenPayload,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { ExpensesService } from './expenses.service.js';

@ApiTags('Expenses & Receipts (M2)')
@Controller('api/v1')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // --- Receipt Upload Flow ---

  @Post('expenses/receipts/presign')
  @ApiOperation({ summary: 'Generate a presigned upload URL for a receipt attachment' })
  @ApiResponse({ status: 201, description: 'Presigned upload URL generated' })
  async presignReceipt(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: PresignReceiptUploadInput
  ) {
    const validated = PresignReceiptUploadSchema.parse(body);
    return this.expensesService.presignReceipt(tenantId, user.userId, validated);
  }

  @Post('expenses/:id/receipts/presign')
  @ApiOperation({ summary: 'Generate a presigned upload URL for an existing expense receipt' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 201, description: 'Presigned upload URL generated' })
  async presignReceiptForExpense(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') expenseId: string,
    @Body() body: PresignReceiptUploadInput
  ) {
    const validated = PresignReceiptUploadSchema.parse({ ...body, expenseId });
    return this.expensesService.presignReceipt(tenantId, user.userId, validated);
  }

  @Post('expenses/receipts/confirm')
  @ApiOperation({ summary: 'Confirm receipt upload, trigger OCR, and verify exact hash duplicates' })
  @ApiResponse({ status: 201, description: 'Receipt confirmed and OCR extraction initiated' })
  async confirmReceipt(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: ConfirmReceiptUploadInput
  ) {
    const validated = ConfirmReceiptUploadSchema.parse(body);
    return this.expensesService.confirmReceipt(tenantId, user.userId, validated);
  }

  @Post('expenses/:id/receipts/confirm')
  @ApiOperation({ summary: 'Confirm receipt upload for existing expense, trigger OCR, and check duplicate' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 201, description: 'Receipt confirmed and linked' })
  async confirmReceiptForExpense(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') expenseId: string,
    @Body() body: ConfirmReceiptUploadInput
  ) {
    const validated = ConfirmReceiptUploadSchema.parse({ ...body, expenseId });
    return this.expensesService.confirmReceipt(tenantId, user.userId, validated);
  }

  @Get('receipts/:id/url')
  @ApiOperation({ summary: 'Generate time-limited signed URL to view/download receipt' })
  @ApiParam({ name: 'id', description: 'Receipt ID' })
  @ApiResponse({ status: 200, description: 'Signed URL generated with 15min expiry' })
  async getReceiptSignedUrl(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') receiptId: string
  ) {
    return this.expensesService.getReceiptSignedUrl(tenantId, receiptId, user.role);
  }

  // --- OCR Human Review Confirmation ---

  @Post('expenses/ocr/confirm-review')
  @ApiOperation({ summary: 'Confirm human review of OCR suggested fields before submission' })
  @ApiResponse({ status: 200, description: 'OCR suggestions human-confirmed' })
  async confirmOcrReview(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: ConfirmOcrReviewInput
  ) {
    const validated = ConfirmOcrReviewSchema.parse(body);
    return this.expensesService.confirmOcrReview(tenantId, user.userId, validated);
  }

  // --- Expense CRUD ---

  @Post('expenses')
  @ApiOperation({ summary: 'Create a new expense item with decimal arithmetic and duplicate check' })
  @ApiResponse({ status: 201, description: 'Expense draft created successfully' })
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateExpenseInput
  ) {
    const validated = CreateExpenseSchema.parse(body);
    return this.expensesService.create(tenantId, user, validated);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses for the tenant with privacy and status filters' })
  @ApiResponse({ status: 200, description: 'List of expenses with pagination metadata' })
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: ExpenseFilterQuery
  ) {
    const validated = ExpenseFilterQuerySchema.parse(query);
    return this.expensesService.findAll(tenantId, user, validated);
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get full details of an expense including line items and signed receipt links' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Full expense details' })
  async findOne(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') expenseId: string
  ) {
    return this.expensesService.findById(tenantId, expenseId, user);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update an existing draft or rejected expense' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  async update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') expenseId: string,
    @Body() body: UpdateExpenseInput
  ) {
    const validated = UpdateExpenseSchema.parse(body);
    return this.expensesService.update(tenantId, expenseId, user, validated);
  }

  @Delete('expenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an expense draft' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  async remove(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') expenseId: string
  ) {
    return this.expensesService.remove(tenantId, expenseId, user);
  }
}
