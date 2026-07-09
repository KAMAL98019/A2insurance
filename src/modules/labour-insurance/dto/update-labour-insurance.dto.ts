import { PartialType } from '@nestjs/mapped-types';
import { CreateLabourInsuranceDto } from './create-labour-insurance.dto';
export class UpdateLabourInsuranceDto extends PartialType(CreateLabourInsuranceDto) {}
