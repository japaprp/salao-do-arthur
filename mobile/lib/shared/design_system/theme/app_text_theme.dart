import 'package:flutter/material.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';

class AppTextTheme {
  AppTextTheme._();

  static TextTheme build() {
    return const TextTheme(
      headlineLarge: TextStyle(
        fontSize: 42,
        height: 0.98,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
        fontFamily: 'Georgia',
      ),
      headlineMedium: TextStyle(
        fontSize: 32,
        height: 1.05,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
        fontFamily: 'Georgia',
      ),
      titleLarge: TextStyle(
        fontSize: 22,
        height: 1.2,
        fontWeight: FontWeight.w800,
        color: AppColors.ink,
        fontFamily: 'Segoe UI',
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        height: 1.25,
        fontWeight: FontWeight.w800,
        color: AppColors.ink,
        fontFamily: 'Segoe UI',
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        height: 1.5,
        fontWeight: FontWeight.w500,
        color: AppColors.ink,
        fontFamily: 'Segoe UI',
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        height: 1.45,
        fontWeight: FontWeight.w500,
        color: AppColors.textMuted,
        fontFamily: 'Segoe UI',
      ),
      labelLarge: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.6,
        color: AppColors.primary,
        fontFamily: 'Segoe UI',
      ),
    );
  }
}
