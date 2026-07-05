import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:barbearia_do_artur_mobile/app/navigation/app_route.dart';
import 'package:barbearia_do_artur_mobile/core/constants/app_constants.dart';
import 'package:barbearia_do_artur_mobile/core/utils/input_validators.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/providers/auth_providers.dart';
import 'package:barbearia_do_artur_mobile/features/auth/presentation/widgets/auth_header.dart';
import 'package:barbearia_do_artur_mobile/features/auth/presentation/widgets/auth_status_banner.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_gradient_scaffold.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_feedback_banner.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_logo.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_primary_button.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_secondary_button.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_surface_card.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_text_field.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  bool _requestSent = false;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authFlowControllerProvider);

    return AppGradientScaffold(
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AppLogo(
              subtitle: 'Recuperar acesso',
            ),
            const SizedBox(height: AppSpacing.xl),
            const AuthHeader(
              eyebrow: 'Esqueci minha senha',
              title: 'Recupere o acesso sem travar seu horário.',
              description:
                  'Informe seu email. Se existir cadastro, enviamos um link temporário para trocar a senha.',
            ),
            const SizedBox(height: AppSpacing.xl),
            AppSurfaceCard(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (authState.failureMessage != null) ...[
                      AuthStatusBanner(message: authState.failureMessage!),
                      const SizedBox(height: AppSpacing.md),
                    ],
                    if (_requestSent) ...[
                      const AppFeedbackBanner(
                        message:
                            'Pedido recebido. Confira seu email e use o link antes de expirar.',
                        tone: AppFeedbackTone.success,
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],
                    AppTextField(
                      controller: _emailController,
                      label: 'Email cadastrado',
                      keyboardType: TextInputType.emailAddress,
                      validator: InputValidators.email,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppPrimaryButton(
                      label: 'Enviar link de senha',
                      isLoading: authState.isBusy,
                      onPressed: _submit,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    AppSecondaryButton(
                      label: 'Voltar para entrar',
                      onPressed: () => context.go(AppRoute.signIn),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final sent =
        await ref.read(authFlowControllerProvider.notifier).forgotPassword(
              tenantSubdomain: AppConstants.defaultTenantSubdomain,
              email: _emailController.text.trim(),
            );

    if (!mounted || !sent) {
      return;
    }

    setState(() {
      _requestSent = true;
    });
  }
}
