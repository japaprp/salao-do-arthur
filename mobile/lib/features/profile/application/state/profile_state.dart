import 'package:barbearia_do_artur_mobile/features/profile/domain/entities/client_profile.dart';

class ProfileState {
  const ProfileState({
    this.isLoading = false,
    this.failureMessage,
    this.profile,
  });

  final bool isLoading;
  final String? failureMessage;
  final ClientProfile? profile;

  ProfileState copyWith({
    bool? isLoading,
    String? failureMessage,
    ClientProfile? profile,
    bool clearFailureMessage = false,
  }) {
    return ProfileState(
      isLoading: isLoading ?? this.isLoading,
      failureMessage:
          clearFailureMessage ? null : (failureMessage ?? this.failureMessage),
      profile: profile ?? this.profile,
    );
  }
}
