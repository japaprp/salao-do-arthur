import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:app_links/app_links.dart';
import 'package:barbearia_do_artur_mobile/app/navigation/app_route.dart';
import 'package:barbearia_do_artur_mobile/features/store/application/providers/store_providers.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_cart_model.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_order_model.dart';
import 'package:barbearia_do_artur_mobile/features/store/infrastructure/models/store_product_model.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/theme/design_tokens.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_gradient_scaffold.dart';
import 'package:barbearia_do_artur_mobile/shared/design_system/widgets/app_surface_card.dart';

class StoreScreen extends ConsumerStatefulWidget {
  const StoreScreen({super.key});

  @override
  ConsumerState<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends ConsumerState<StoreScreen> {
  final AppLinks _appLinks = AppLinks();
  StreamSubscription<Uri>? _paymentLinkSubscription;

  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(storeControllerProvider.notifier).loadInitialData(),
    );
    _paymentLinkSubscription = _appLinks.uriLinkStream.listen((uri) {
      if (uri.scheme == 'barbeariadoartur' &&
          uri.host == 'payments' &&
          uri.path == '/result') {
        final orderId = uri.queryParameters['orderId'];
        if (orderId != null) {
          ref.read(storeControllerProvider.notifier).refreshOrderStatus(orderId);
        }
      }
    });
  }

  @override
  void dispose() {
    _paymentLinkSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(storeControllerProvider, (previous, next) {
      final message = next.successMessage ?? next.failureMessage;
      if (message != null &&
          message != previous?.successMessage &&
          message != previous?.failureMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    });

    final state = ref.watch(storeControllerProvider);
    final controller = ref.read(storeControllerProvider.notifier);

    return DefaultTabController(
      length: 3,
      child: AppGradientScaffold(
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  tooltip: 'Voltar',
                  onPressed: () => context.go(AppRoute.home),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                Expanded(
                  child: Text(
                    'Loja',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                IconButton(
                  tooltip: 'Atualizar',
                  onPressed: state.isLoading ? null : controller.loadInitialData,
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            AppSurfaceCard(
              padding: const EdgeInsets.all(AppSpacing.xs),
              child: TabBar(
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textMuted,
                indicatorSize: TabBarIndicatorSize.tab,
                indicator: BoxDecoration(
                  color: AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(AppRadii.md),
                ),
                tabs: [
                  const Tab(
                    icon: Icon(Icons.storefront_outlined),
                    text: 'Produtos',
                  ),
                  Tab(
                    icon: const Icon(Icons.shopping_bag_outlined),
                    text: 'Carrinho ${state.resolvedCart.totalItems}',
                  ),
                  const Tab(
                    icon: Icon(Icons.receipt_long_outlined),
                    text: 'Pedidos',
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Expanded(
              child: state.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : TabBarView(
                      children: [
                        _ProductsTab(
                          products: state.products,
                          favoriteProductIds: state.favoriteProductIds,
                          onAddToCart: controller.addToCart,
                          onToggleFavorite: controller.toggleFavorite,
                          isSubmitting: state.isSubmitting,
                        ),
                        _CartTab(
                          cart: state.resolvedCart,
                          isSubmitting: state.isSubmitting,
                          onUpdateQuantity: controller.updateQuantity,
                          onRemove: controller.removeFromCart,
                          onCheckout: controller.checkout,
                        ),
                        _OrdersTab(orders: state.orders),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductsTab extends StatelessWidget {
  const _ProductsTab({
    required this.products,
    required this.favoriteProductIds,
    required this.onAddToCart,
    required this.onToggleFavorite,
    required this.isSubmitting,
  });

  final List<StoreProductModel> products;
  final Set<String> favoriteProductIds;
  final Future<void> Function(String productId) onAddToCart;
  final Future<void> Function(String productId) onToggleFavorite;
  final bool isSubmitting;

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return const Center(child: Text('Nenhum produto disponível.'));
    }

    return ListView.separated(
      itemCount: products.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (context, index) {
        final product = products[index];
        final isFavorite = favoriteProductIds.contains(product.id);

        return AppSurfaceCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(AppRadii.md),
                ),
                child: const Icon(
                  Icons.spa_outlined,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.name, style: Theme.of(context).textTheme.titleMedium),
                    if (product.description != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        product.description!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textMuted,
                            ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      _formatMoney(product.price),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.primary,
                          ),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  IconButton(
                    tooltip: isFavorite ? 'Remover favorito' : 'Favoritar',
                    onPressed: isSubmitting ? null : () => onToggleFavorite(product.id),
                    icon: Icon(
                      isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                    ),
                  ),
                  IconButton.filledTonal(
                    tooltip: 'Adicionar',
                    onPressed: product.inStock && !isSubmitting
                        ? () => onAddToCart(product.id)
                        : null,
                    icon: const Icon(Icons.add_shopping_cart_rounded),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _CartTab extends StatelessWidget {
  const _CartTab({
    required this.cart,
    required this.isSubmitting,
    required this.onUpdateQuantity,
    required this.onRemove,
    required this.onCheckout,
  });

  final StoreCartModel cart;
  final bool isSubmitting;
  final Future<void> Function(String itemId, int quantity) onUpdateQuantity;
  final Future<void> Function(String itemId) onRemove;
  final Future<void> Function() onCheckout;

  @override
  Widget build(BuildContext context) {
    if (cart.items.isEmpty) {
      return const Center(child: Text('Carrinho vazio.'));
    }

    return Column(
      children: [
        Expanded(
          child: ListView.separated(
            itemCount: cart.items.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              final item = cart.items[index];
              return AppSurfaceCard(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.product.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(_formatMoney(item.totalAmount)),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Diminuir',
                      onPressed: isSubmitting
                          ? null
                          : () => onUpdateQuantity(item.id, item.quantity - 1),
                      icon: const Icon(Icons.remove_rounded),
                    ),
                    SizedBox(
                      width: 32,
                      child: Text(
                        '${item.quantity}',
                        textAlign: TextAlign.center,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Aumentar',
                      onPressed: isSubmitting
                          ? null
                          : () => onUpdateQuantity(item.id, item.quantity + 1),
                      icon: const Icon(Icons.add_rounded),
                    ),
                    IconButton(
                      tooltip: 'Remover',
                      onPressed: isSubmitting ? null : () => onRemove(item.id),
                      icon: const Icon(Icons.delete_outline_rounded),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AppSurfaceCard(
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _formatMoney(cart.totalAmount),
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              FilledButton.icon(
                onPressed: isSubmitting ? null : onCheckout,
                icon: const Icon(Icons.pix_rounded),
                label: const Text('Finalizar'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _OrdersTab extends StatelessWidget {
  const _OrdersTab({required this.orders});

  final List<StoreOrderModel> orders;

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return const Center(child: Text('Nenhum pedido ainda.'));
    }

    return ListView.separated(
      itemCount: orders.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (context, index) {
        final order = orders[index];
        return AppSurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.number,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Text(_formatMoney(order.totalAmount)),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                order.displayStatus,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textMuted,
                    ),
              ),
              const SizedBox(height: AppSpacing.sm),
              ...order.items.map(
                (item) => Text('${item.quantity}x ${item.productName}'),
              ),
            ],
          ),
        );
      },
    );
  }
}

String _formatMoney(double value) {
  return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
}
