import { PartialType } from '@nestjs/mapped-types';
import { CreateInsuranceCompanyDto } from './create-insurance-company.dto';

export class UpdateInsuranceCompanyDto extends PartialType(CreateInsuranceCompanyDto) {}
