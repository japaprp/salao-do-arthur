import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:barbearia_do_artur_mobile/app/navigation/app_route.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/providers/auth_dependencies.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/providers/auth_providers.dart';
import 'package:barbearia_do_artur_mobile/features/auth/presentation/widgets/auth_header.dart';
import 'package:barbearia_do_artur_mobile/features/auth/presentation/widgets/onboarding_slide_card.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_gradient_scaffold.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_logo.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_primary_button.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_secondary_button.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  late final PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slides = ref.watch(onboardingSlidesProvider);
    final isLastPage = _currentPage == slides.length - 1;

    return AppGradientScaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final pageHeight = constraints.maxHeight < 720 ? 300.0 : 340.0;

          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AppLogo(
                    subtitle: 'Agenda, pacotes e lojinha',
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  const AuthHeader(
                    eyebrow: 'Barbearia do Artur',
                    title: 'Seu horario no jeito certo.',
                    description:
                        'Marque corte, barba, sobrancelha, luzes ou trancas, acompanhe pacotes e compre produtos reais da lojinha.',
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  SizedBox(
                    height: pageHeight,
                    child: PageView.builder(
                      controller: _pageController,
                      itemCount: slides.length,
                      onPageChanged: (index) {
                        setState(() {
                          _currentPage = index;
                        });
                      },
                      itemBuilder: (context, index) {
                        return OnboardingSlideCard(
                          slide: slides[index],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      slides.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentPage == index ? 28 : 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? AppColors.primary
                              : AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  AppPrimaryButton(
                    label:
                        isLastPage ? 'Entrar ou criar conta' : 'Proximo passo',
                    onPressed: () async {
                      if (!isLastPage) {
                        await _pageController.nextPage(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeInOut,
                        );
                        return;
                      }

                      await ref
                          .read(authFlowControllerProvider.notifier)
                          .completeOnboarding();
                      if (!context.mounted) {
                        return;
                      }
                      context.go(AppRoute.signIn);
                    },
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  AppSecondaryButton(
                    label: 'Pular e ir para login',
                    onPressed: () async {
                      await ref
                          .read(authFlowControllerProvider.notifier)
                          .completeOnboarding();
                      if (!context.mounted) {
                        return;
                      }
                      context.go(AppRoute.signIn);
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
