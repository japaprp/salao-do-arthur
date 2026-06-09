import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Validar que data é no futuro
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!value) return false;
    if (!(typeof value === 'string' || typeof value === 'number' || value instanceof Date)) {
      return false;
    }

    const date = new Date(value);
    return date > new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} deve ser uma data no futuro`;
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

// Validar UUID
@ValidatorConstraint({ name: 'isUuid', async: false })
export class IsUuidConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!value) return false;
    if (typeof value !== 'string') return false;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} deve ser um UUID válido`;
  }
}

export function IsValidUuid(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUuidConstraint,
    });
  };
}
