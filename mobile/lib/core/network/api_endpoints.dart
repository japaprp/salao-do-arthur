class ApiEndpoints {
  ApiEndpoints._();

  static const String authLogin = '/auth/login';
  static const String authRegister = '/auth/register';
  static const String authRefresh = '/auth/refresh';
  static const String authLogout = '/auth/logout';
  static const String authProfile = '/auth/profile';
  static const String clientsMe = '/clients/me';
  static const String servicesActive = '/services/active';
  static const String appointmentsMine = '/appointments/mine';
  static const String appointmentsBook = '/appointments/book';

  static String professionalsAvailable(String serviceId) {
    return '/professionals/available/$serviceId';
  }

  static String appointmentsAvailableSlots({
    required String serviceId,
    required String professionalId,
    required DateTime date,
  }) {
    final year = '${date.year}'.padLeft(4, '0');
    final month = '${date.month}'.padLeft(2, '0');
    final day = '${date.day}'.padLeft(2, '0');

    return Uri(
      path: '/appointments/available-slots',
      queryParameters: {
        'serviceId': serviceId,
        'professionalId': professionalId,
        'date': '$year-$month-$day',
      },
    ).toString();
  }
}
