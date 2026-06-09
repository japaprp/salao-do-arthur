import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';

class ProfileState {
  const ProfileState({
    this.isLoading = false,
    this.isRedeeming = false,
    this.failureMessage,
    this.successMessage,
    this.profile,
  });

  final bool isLoading;
  final bool isRedeeming;
  final String? failureMessage;
  final String? successMessage;
  final ClientProfile? profile;

  ProfileState copyWith({
    bool? isLoading,
    bool? isRedeeming,
    String? failureMessage,
    String? successMessage,
    ClientProfile? profile,
    bool clearFailureMessage = false,
    bool clearSuccessMessage = false,
  }) {
    return ProfileState(
      isLoading: isLoading ?? this.isLoading,
      isRedeeming: isRedeeming ?? this.isRedeeming,
      failureMessage:
          clearFailureMessage ? null : (failureMessage ?? this.failureMessage),
      successMessage:
          clearSuccessMessage ? null : (successMessage ?? this.successMessage),
      profile: profile ?? this.profile,
    );
  }
}
