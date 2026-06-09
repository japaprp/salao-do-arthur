import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:barbearia_do_artur_mobile/features/auth/application/providers/auth_providers.dart';
import 'package:barbearia_do_artur_mobile/features/store/application/providers/store_dependencies.dart';
import 'package:barbearia_do_artur_mobile/features/store/application/state/store_state.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/datasources/store_remote_data_source.dart';

class StoreController extends Notifier<StoreState> {
  late final StoreRemoteDataSource _remoteDataSource;

  @override
  StoreState build() {
    _remoteDataSource = ref.read(storeRemoteDataSourceProvider);
    return const StoreState();
  }

  Future<void> loadInitialData() async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    state = state.copyWith(
      isLoading: true,
      clearFailureMessage: true,
      clearSuccessMessage: true,
    );

    try {
      final products = await _remoteDataSource.getProducts(accessToken);
      final cart = await _remoteDataSource.getCart(accessToken);
      final orders = await _remoteDataSource.getOrders(accessToken);
      final favoriteIds = await _remoteDataSource.getFavoriteProductIds(accessToken);

      state = state.copyWith(
        isLoading: false,
        products: products,
        cart: cart,
        orders: orders,
        favoriteProductIds: favoriteIds.toSet(),
        clearFailureMessage: true,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        failureMessage: 'Não foi possível carregar a loja.',
      );
    }
  }

  Future<void> addToCart(String productId) async {
    await _runCartAction(
      action: (accessToken) => _remoteDataSource.addCartItem(
        accessToken: accessToken,
        productId: productId,
      ),
      successMessage: 'Produto adicionado ao carrinho.',
    );
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    await _runCartAction(
      action: (accessToken) => _remoteDataSource.updateCartItem(
        accessToken: accessToken,
        itemId: itemId,
        quantity: quantity,
      ),
      successMessage: 'Carrinho atualizado.',
    );
  }

  Future<void> removeFromCart(String itemId) async {
    await _runCartAction(
      action: (accessToken) => _remoteDataSource.removeCartItem(
        accessToken: accessToken,
        itemId: itemId,
      ),
      successMessage: 'Item removido do carrinho.',
    );
  }

  Future<void> checkout() async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    state = state.copyWith(
      isSubmitting: true,
      clearFailureMessage: true,
      clearSuccessMessage: true,
    );

    try {
      final checkout = await _remoteDataSource.checkout(accessToken);
      if (checkout.checkoutUrl.isEmpty) {
        throw StateError('Checkout sem URL.');
      }
      final launched = await launchUrl(
        Uri.parse(checkout.checkoutUrl),
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw StateError('Não foi possível abrir o Mercado Pago.');
      }
      final cart = await _remoteDataSource.getCart(accessToken);
      final orders = await _remoteDataSource.getOrders(accessToken);
      final products = await _remoteDataSource.getProducts(accessToken);

      state = state.copyWith(
        isSubmitting: false,
        cart: cart,
        orders: orders,
        products: products,
        successMessage: 'Pedido criado. Finalize o pagamento no Mercado Pago.',
        clearFailureMessage: true,
      );
    } catch (_) {
      state = state.copyWith(
        isSubmitting: false,
        failureMessage: 'Não foi possível finalizar a compra.',
      );
    }
  }

  Future<void> refreshOrderStatus(String orderId) async {
    final accessToken = _readAccessToken();
    if (accessToken == null || orderId.isEmpty) {
      return;
    }

    try {
      final order = await _remoteDataSource.getOrderStatus(
        accessToken: accessToken,
        orderId: orderId,
      );
      state = state.copyWith(
        orders: [
          order,
          ...state.orders.where((item) => item.id != order.id),
        ],
        successMessage: order.displayStatus,
        clearFailureMessage: true,
      );
    } catch (_) {
      state = state.copyWith(
        failureMessage: 'Não foi possível atualizar o status do pagamento.',
      );
    }
  }

  Future<void> toggleFavorite(String productId) async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    final favorites = {...state.favoriteProductIds};
    final isFavorite = favorites.contains(productId);
    try {
      if (isFavorite) {
        await _remoteDataSource.removeFavorite(
          accessToken: accessToken,
          productId: productId,
        );
        favorites.remove(productId);
      } else {
        await _remoteDataSource.addFavorite(
          accessToken: accessToken,
          productId: productId,
        );
        favorites.add(productId);
      }
      state = state.copyWith(
        favoriteProductIds: favorites,
        clearFailureMessage: true,
        clearSuccessMessage: true,
      );
    } catch (_) {
      state = state.copyWith(
        failureMessage: 'Não foi possível atualizar favoritos.',
      );
    }
  }

  Future<void> _runCartAction({
    required Future<dynamic> Function(String accessToken) action,
    required String successMessage,
  }) async {
    final accessToken = _readAccessToken();
    if (accessToken == null) {
      state = state.copyWith(
        failureMessage: 'Sessao expirada. Faça login novamente.',
      );
      return;
    }

    state = state.copyWith(
      isSubmitting: true,
      clearFailureMessage: true,
      clearSuccessMessage: true,
    );

    try {
      final cart = await action(accessToken);
      state = state.copyWith(
        isSubmitting: false,
        cart: cart,
        successMessage: successMessage,
        clearFailureMessage: true,
      );
    } catch (_) {
      state = state.copyWith(
        isSubmitting: false,
        failureMessage: 'Não foi possível atualizar o carrinho.',
      );
    }
  }

  String? _readAccessToken() {
    return ref.read(authFlowControllerProvider).session?.accessToken;
  }
}
