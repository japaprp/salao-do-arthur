import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:salao_da_lu_mobile/app/navigation/app_route.dart';
import 'package:salao_da_lu_mobile/app/navigation/router_refresh_notifier.dart';
import 'package:salao_da_lu_mobile/features/auth/application/providers/auth_providers.dart';
import 'package:salao_da_lu_mobile/features/auth/presentation/screens/onboarding_screen.dart';
import 'package:salao_da_lu_mobile/features/auth/presentation/screens/sign_in_screen.dart';
import 'package:salao_da_lu_mobile/features/auth/presentation/screens/sign_up_screen.dart';
import 'package:salao_da_lu_mobile/features/appointments/presentation/screens/appointments_screen.dart';
import 'package:salao_da_lu_mobile/features/home/presentation/screens/client_home_screen.dart';
import 'package:salao_da_lu_mobile/features/profile/presentation/screens/profile_screen.dart';

final routerRefreshNotifierProvider = Provider<RouterRefreshNotifier>((ref) {
  final notifier = RouterRefreshNotifier();
  ref.listen(
    authFlowControllerProvider,
    (_, __) => notifier.refresh(),
  );
  ref.onDispose(notifier.dispose);
  return notifier;
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final refreshListenable = ref.watch(routerRefreshNotifierProvider);

  return GoRouter(
    initialLocation: AppRoute.onboarding,
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final authState = ref.read(authFlowControllerProvider);
      final location = state.matchedLocation;

      final isOnboardingRoute = location == AppRoute.onboarding;
      final isAuthRoute =
          location == AppRoute.signIn || location == AppRoute.signUp;
      final isProtectedRoute = location.startsWith(AppRoute.home);

      if (!authState.onboardingCompleted && !isOnboardingRoute) {
        return AppRoute.onboarding;
      }

      if (authState.onboardingCompleted &&
          !authState.isAuthenticated &&
          isOnboardingRoute) {
        return AppRoute.signIn;
      }

      if (authState.onboardingCompleted &&
          !authState.isAuthenticated &&
          isProtectedRoute) {
        return AppRoute.signIn;
      }

      if (authState.isAuthenticated && (isOnboardingRoute || isAuthRoute)) {
        return AppRoute.home;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: AppRoute.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoute.signIn,
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: AppRoute.signUp,
        builder: (context, state) => const SignUpScreen(),
      ),
      GoRoute(
        path: AppRoute.home,
        builder: (context, state) => const ClientHomeScreen(),
      ),
      GoRoute(
        path: AppRoute.appointments,
        builder: (context, state) => const AppointmentsScreen(),
      ),
      GoRoute(
        path: AppRoute.profile,
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});
