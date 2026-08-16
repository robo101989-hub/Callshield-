import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReportCategory {
  UPI_FRAUD = 'UPI_FRAUD',
  BANK_FRAUD = 'BANK_FRAUD',
  POLICE_IMPERSONATION = 'POLICE_IMPERSONATION',
  KYC_FRAUD = 'KYC_FRAUD',
  LOAN_HARASSMENT = 'LOAN_HARASSMENT',
  JOB_SCAM = 'JOB_SCAM',
  INVESTMENT_SCAM = 'INVESTMENT_SCAM',
  DELIVERY_SCAM = 'DELIVERY_SCAM',
  TECH_SUPPORT = 'TECH_SUPPORT',
  OTHER = 'OTHER',
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateReportDto {
  @IsEnum(ReportCategory)
  category!: ReportCategory;

  @IsEnum(Severity)
  severity!: Severity;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
