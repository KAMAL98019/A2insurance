import { PartialType } from '@nestjs/mapped-types';
import { CreateFireInsuranceDto } from './create-fire-insurance.dto';
export class UpdateFireInsuranceDto extends PartialType(CreateFireInsuranceDto) {}
