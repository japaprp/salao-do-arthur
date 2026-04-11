import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:salao_da_lu_mobile/app/navigation/app_route.dart';
import 'package:salao_da_lu_mobile/core/utils/input_validators.dart';
import 'package:salao_da_lu_mobile/features/auth/application/providers/auth_providers.dart';
import 'package:salao_da_lu_mobile/features/auth/domain/entities/register_command.dart';
import 'package:salao_da_lu_mobile/features/auth/presentation/widgets/auth_header.dart';
import 'package:salao_da_lu_mobile/features/auth/presentation/widgets/auth_status_banner.dart';
import 'package:salao_da_lu_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_gradient_scaffold.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_logo.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_primary_button.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_surface_card.dart';
import 'package:salao_da_lu_mobile/shared/design_system/widgets/app_text_field.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _tenantSubdomainController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _tenantSubdomainController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _tenantSubdomainController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
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
              subtitle: 'Cadastro inicial',
            ),
            const SizedBox(height: AppSpacing.xl),
            const AuthHeader(
              eyebrow: 'Auth / Sign up',
              title:
                  'Cadastre seu perfil de cliente sobre a foundation correta.',
              description:
                  'O cadastro do cliente agora usa o codigo publico do salao. O backend resolve o tenant e cria tambem o perfil Client para a proxima fase de agendamento.',
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
                    AppTextField(
                      controller: _nameController,
                      label: 'Nome completo',
                      validator: (value) =>
                          InputValidators.requiredField(value, label: 'Nome'),
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      controller: _tenantSubdomainController,
                      label: 'Codigo do salao',
                      validator: InputValidators.salonCode,
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      controller: _emailController,
                      label: 'Email',
                      keyboardType: TextInputType.emailAddress,
                      validator: InputValidators.email,
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      controller: _passwordController,
                      label: 'Senha',
                      obscureText: true,
                      validator: InputValidators.password,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppPrimaryButton(
                      label: 'Criar conta',
                      isLoading: authState.isBusy,
                      onPressed: _submit,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    TextButton(
                      onPressed: () => context.go(AppRoute.signIn),
                      child: const Text('Ja tenho conta'),
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

    await ref.read(authFlowControllerProvider.notifier).register(
          RegisterCommand(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text.trim(),
            tenantSubdomain: _tenantSubdomainController.text.trim(),
          ),
        );
  }
}
