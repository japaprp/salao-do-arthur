import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barbearia_do_artur_mobile/features/store/application/controllers/store_controller.dart';
import 'package:barbearia_do_artur_mobile/features/store/application/state/store_state.dart';

final storeControllerProvider =
    NotifierProvider<StoreController, StoreState>(StoreController.new);
