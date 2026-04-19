# Mobile App - Melhorias e Roadmap

> Documento de referência histórica. O app atual já usa API real, refresh token real e logout contra o backend. Exemplos com `mock` aqui não representam o fluxo vigente de produção.

## 📱 Flutter - Salão da Lu Mobile

### Status Atual
- ✅ Estrutura básica implementada (Feature-First, Riverpod)
- ✅ Autenticação base
- ✅ Client app em desenvolvimento
- 🔄 Staff app para profissionais (TODO)

---

## 🎯 Melhorias Recomendadas

### 1. Testes Unitários e Widget Tests
```bash
# Estrutura de testes
lib/
├── features/
│   ├── auth/
│   │   ├── presentation/
│   │   ├── data/
│   │   └── domain/
│   └── client/
└── test/
    ├── features/
    │   ├── auth/
    │   │   └── presentation/
    │   └── client/
    ├── widget_test.dart
    └── mocks/
```

### Exemplo de Test:
```dart
// test/features/auth/domain/login_usecase_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

void main() {
  group('LoginUseCase', () {
    late MockAuthRepository mockRepo;
    late LoginUseCase usecase;

    setUp(() {
      mockRepo = MockAuthRepository();
      usecase = LoginUseCase(mockRepo);
    });

    test('should return user token on valid credentials', () async {
      // Arrange
      final request = LoginRequest(email: 'test@email.com', password: '123');
      final expected = LoginResponse(token: 'valid_token');
      
      when(mockRepo.login(request))
        .thenAnswer((_) async => expected);

      // Act
      final result = await usecase(request);

      // Assert
      expect(result, expected);
      verify(mockRepo.login(request)).called(1);
    });
  });
}
```

### 2. Validação de Entrada e Error Handling
```dart
// lib/core/validators/email_validator.dart

abstract class Validator {
  static const emailRegex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  static const phoneRegex = r'^\+?[0-9]{10,}$';

  static String? validateEmail(String value) {
    if (value.isEmpty) return 'Email é obrigatório';
    if (!RegExp(emailRegex).hasMatch(value)) {
      return 'Email inválido';
    }
    return null;
  }

  static String? validatePhone(String value) {
    if (value.isEmpty) return 'Telefone é obrigatório';
    if (!RegExp(phoneRegex).hasMatch(value)) {
      return 'Telefone inválido';
    }
    return null;
  }
}

// Uso em Forms:
TextFormField(
  validator: Validator.validateEmail,
  onChanged: (value) {
    // Validação em tempo real
  },
)
```

### 3. State Management com Riverpod
```dart
// lib/features/client/presentation/providers/client_provider.dart

final clientNotifierProvider =
    StateNotifierProvider<ClientNotifier, AsyncValue<Client>>((ref) {
  return ClientNotifier(ref.watch(clientRepositoryProvider));
});

class ClientNotifier extends StateNotifier<AsyncValue<Client>> {
  final ClientRepository _repository;

  ClientNotifier(this._repository)
      : super(const AsyncValue.loading());

  Future<void> fetchClient(String clientId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _repository.getClient(clientId),
    );
  }

  Future<void> updateClient(Client client) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _repository.updateClient(client),
    );
  }
}
```

### 4. Segurança - JWT Token Management
```dart
// lib/core/storage/secure_storage.dart

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStorage {
  static const _tokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _tenantIdKey = 'tenant_id';

  final FlutterSecureStorage _storage;

  SecureTokenStorage(this._storage);

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required String tenantId,
  }) async {
    await Future.wait([
      _storage.write(key: _tokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
      _storage.write(key: _tenantIdKey, value: tenantId),
    ]);
  }

  Future<String?> getAccessToken() async {
    // Verificar se expirou
    final token = await _storage.read(key: _tokenKey);
    if (_isTokenExpired(token)) {
      await refreshAccessToken();
    }
    return token;
  }

  Future<void> refreshAccessToken() async {
    // Chamar backend para refresh
    // Salvar novo token
  }

  bool _isTokenExpired(String? token) {
    // Decodificar JWT e verificar exp
    // ...
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _tokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _tenantIdKey),
    ]);
  }
}
```

### 5. Network Request Interceptor
```dart
// lib/core/network/dio_client.dart

import 'package:dio/dio.dart';

class DioClient {
  final Dio _dio;
  final SecureTokenStorage _tokenStorage;

  DioClient({
    required Dio dio,
    required SecureTokenStorage tokenStorage,
  })  : _dio = dio,
        _tokenStorage = tokenStorage {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Adicionar token e tenant ID a cada request
          final token = await _tokenStorage.getAccessToken();
          final tenantId = await _tokenStorage.getTenantId();

          options.headers['Authorization'] = 'Bearer $token';
          options.headers['X-Tenant-ID'] = tenantId;

          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expirou, fazer refresh
            final refreshed = await _tokenStorage.refreshAccessToken();
            if (refreshed) {
              return handler.resolve(await _retry(error.requestOptions));
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
}
```

### 6. Logging e Crash Reporting
```dart
// lib/core/config/firebase_config.dart

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

Future<void> initFirebase() async {
  await Firebase.initializeApp();

  // Setup Crashlytics
  FlutterError.onError = (errorDetails) {
    FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
  };

  // Capturar exceptions de async
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };
}

// Uso:
FirebaseCrashlytics.instance.log('User logged in successfully');
```

### 7. Testes de Integração (E2E)
```bash
# pubspec.yaml
dev_dependencies:
  integration_test:
    sdk: flutter
  flutter_test:
    sdk: flutter
```

```dart
// test/integration/auth_flow_test.dart

import 'package:integration_test/integration_test.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Auth Flow E2E Test', () {
    testWidgets('User can login and see appointments', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(const MyApp());

      // Act - Enter email
      await tester.enterText(find.byKey(Key('email_field')), 'test@email.com');
      
      // Act - Enter password
      await tester.enterText(find.byKey(Key('password_field')), '123456');
      
      // Act - Tap login
      await tester.tap(find.byKey(Key('login_button')));
      await tester.pumpAndSettle(Duration(seconds: 2));

      // Assert - Should see appointments
      expect(find.byKey(Key('appointments_list')), findsOneWidget);
    });
  });
}
```

### 8. Performance - Lazy Loading e Caching
```dart
// lib/features/client/data/repositories/client_repository.dart

class ClientRepository {
  final ClientRemoteDataSource _remoteDataSource;
  final ClientLocalDataSource _localDataSource;

  Future<Client> getClient(String id) async {
    try {
      // Tentar cache local primeiro (offline support)
      final localClient = await _localDataSource.getClient(id);
      if (localClient != null) {
        // Atualizar em background
        _updateInBackground(id);
        return localClient;
      }

      // Se não tiver em cache, buscar remoto
      final remoteClient = await _remoteDataSource.getClient(id);
      
      // Salvar em cache
      await _localDataSource.saveClient(remoteClient);
      
      return remoteClient;
    } catch (e) {
      // Retornar cache mesmo se expirado em caso de erro
      final cached = await _localDataSource.getClient(id);
      if (cached != null) return cached;
      rethrow;
    }
  }

  Future<void> _updateInBackground(String id) async {
    try {
      final updated = await _remoteDataSource.getClient(id);
      await _localDataSource.saveClient(updated);
    } catch (e) {
      // Log erro mas não falha
      print('Background update failed: $e');
    }
  }
}
```

---

## 🔄 Staff App - Roadmap

### Funcionalidades para Implementar:
- [ ] Dashboard com agenda do dia
- [ ] Confirmação/conclusão de agendamentos
- [ ] Gestão de comissões
- [ ] Histórico de clientes
- [ ] Avaliação de clientes
- [ ] Notifications em tempo real (Firebase Cloud Messaging)

---

## 📊 Testes - Meta de Cobertura

```bash
# Rodar testes com cobertura
flutter test --coverage

# Gerar relatório HTML
genhtml coverage/lcov.info -o coverage/html

# Meta: 70% de cobertura de código
```

---

## 🔐 Checklist de Segurança

- [ ] Tokens armazenados em secure storage (iOS/Android)
- [ ] Certificação SSL/TLS pinning (opcional)
- [ ] Validação rigorosa de entrada
- [ ] Sem logs de dados sensíveis
- [ ] Criptografia de dados locais
- [ ] ProGuard/R8 habilitado em produção

---

## 📦 pubspec.yaml - Dependências Recomendadas

```yaml
dependencies:
  flutter:
    sdk: flutter
  # State Management
  riverpod: ^2.4.0
  riverpod_generator: ^2.3.0
  
  # Networking
  dio: ^5.3.0
  dio_retry: ^4.2.0
  
  # Storage
  flutter_secure_storage: ^9.0.0
  hive: ^2.2.3
  
  # UI/UX
  material_design_icons_flutter: ^7.0.0
  cached_network_image: ^3.3.0
  
  # Date/Time
  intl: ^0.19.0
  
  # Firebase
  firebase_core: ^26.0.0
  firebase_crashlytics: ^3.4.0
  firebase_analytics: ^10.8.0
  
  # Error Handling
  fpdart: ^1.1.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  build_runner: ^2.4.6
  riverpod_generator: ^2.3.0
  mocktail: ^1.0.0
```

---

## ✅ Próximas Ações

1. **Imediato:**
   - [ ] Adicionar testes unitários básicos
   - [ ] Implementar SecureTokenStorage
   - [ ] Setup Dio interceptor

2. **Curto Prazo:**
   - [ ] Atingir 60% cobertura de testes
   - [ ] Implementar Firebase Crashlytics
   - [ ] Build staff app básico

3. **Médio Prazo:**
   - [ ] Testes E2E
   - [ ] Caching avançado (Hive)
   - [ ] Real-time notifications

4. **Longo Prazo:**
   - [ ] Offline-first sync
   - [ ] Biometric auth
   - [ ] App Store/Play Store release
