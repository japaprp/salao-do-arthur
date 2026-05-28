import 'package:barbearia_do_artur_mobile/core/constants/app_constants.dart';

class InputValidators {
  InputValidators._();

  static String? requiredField(String? value, {required String label}) {
    if (value == null || value.trim().isEmpty) {
      return '$label e obrigatorio.';
    }

    return null;
  }

  static String? email(String? value) {
    final emptyValidation = requiredField(value, label: 'Email');
    if (emptyValidation != null) {
      return emptyValidation;
    }

    final emailRegExp = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegExp.hasMatch(value!.trim())) {
      return 'Informe um email valido.';
    }

    return null;
  }

  static String? password(String? value) {
    final emptyValidation = requiredField(value, label: 'Senha');
    if (emptyValidation != null) {
      return emptyValidation;
    }

    if (value!.trim().length < AppConstants.minimumPasswordLength) {
      return 'A senha deve ter pelo menos ${AppConstants.minimumPasswordLength} caracteres.';
    }

    return null;
  }

  static String? salonCode(String? value) {
    return requiredField(value, label: 'Código da barbearia');
  }
}
