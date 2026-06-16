import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { Sidebar } from '../../components/sidebar/sidebar';
import { DataTable } from '../../components/data-table/data-table';
import { Pagination } from '../../components/pagination/pagination';
import { SearchBar } from '../../components/search-bar/search-bar';
import { UserFormModal } from '../../components/create-forms/user-form-modal/user-form-modal';
import { RouteFormModal } from '../../components/create-forms/route-form-modal/route-form-modal';
import { PointFormModal } from '../../components/create-forms/point-form-modal/point-form-modal';
import { HistoryDetailsModal } from '../../components/history-details-modal/history-details-modal';
import { ReviewFormModal } from '../../components/create-forms/review-form-modal/review-form-modal';
import { DataService } from '../../../../core/services/data';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import {
  CreatePointPayload,
  CreateRoutePayload,
  CreateUserPayload,
  CreateReviewPayload,
  ITEM_TYPE_OPTIONS,
  ITEM_UI_CONFIG,
  ItemActionConfig,
  ItemModel,
  ItemType,
  ItemTypeOption,
  ItemUiConfig,
  HistoryItem,
  PointItem,
  RouteItem,
  UpdateUserPayload,
  UserItem,
  ReviewItem,
} from '../../../../core/models/items';
import { PointFormValue, RouteFormValue, UserFormValue, ReviewFormValue } from '../../models/forms';

import {
  buildPointInlineUpdatePayload,
  buildRouteInlineUpdatePayload,
  buildUserInlineUpdatePayload,
  buildReviewInlineUpdatePayload,
} from '../../utils/inline-edit-payloads';

@Component({
  selector: 'app-data-manager-page',
  imports: [
    CommonModule,
    Sidebar,
    DataTable,
    Pagination,
    SearchBar,
    UserFormModal,
    RouteFormModal,
    PointFormModal,
    HistoryDetailsModal,
    ReviewFormModal,
  ],
  templateUrl: './data-manager-page.html',
  styleUrl: './data-manager-page.css',
})
export class DataManagerPage implements OnInit {
  private dataService = inject(DataService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  typeOptions: ItemTypeOption[] = ITEM_TYPE_OPTIONS;

  selectedType = signal<ItemType>('users');
  items = signal<ItemModel[]>([]);
  allItems = signal<ItemModel[]>([]);
  selectedIds = signal<string[]>([]);
  loading = signal(false);
  isGlobalSearching = signal(false);
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  totalPages = signal(0);
  searchTerm = signal('');
  loggingOut = signal(false);
  entityCountsLoading = signal(false);
  entityCounts = signal<Record<ItemType, number>>({
    users: 0,
    routes: 0,
    points: 0,
    history: 0,
    reviews: 0,
  });

  showUserModal = signal(false);
  editingUserId = signal<string | null>(null);
  savingUser = signal(false);

  showRouteModal = signal(false);
  editingRouteId = signal<string | null>(null);
  savingRoute = signal(false);

  showPointModal = signal(false);
  editingPointId = signal<string | null>(null);
  savingPoint = signal(false);

  showHistoryDetailsModal = signal(false);
  selectedHistoryItem = signal<HistoryItem | null>(null);

  showReviewModal = signal(false);
  editingReviewId = signal<string | null>(null);
  savingReview = signal(false);

  searching = signal(false);
  inlineEditSavingItemId = signal<string | null>(null);
  inlineEditCompletedItemId = signal<string | null>(null);

  userForm = signal<UserFormValue>({
    name: '',
    surname: '',
    username: '',
    email: '',
    password: '',
    enabled: true,
    role: 'user',
  });

  routeForm = signal<RouteFormValue>({
    name: '',
    description: '',
    city: '',
    country: '',
    distance: null,
    duration: null,
    difficulty: 'easy',
    tags: '',
    userId: '',
  });

  pointForm = signal<PointFormValue>({
    name: '',
    description: '',
    latitude: null,
    longitude: null,
    image: '',
    routeId: '',
    index: null,
  });

  reviewForm = signal<ReviewFormValue>({
    userId: '',
    routeId: '',
    title: '',
    comment: '',
    ratings: [{ label: '', score: null }],
  });

  currentTypeLabel = computed(() => {
    return this.currentTypeConfig().label;
  });

  currentTypeConfig = computed<ItemUiConfig>(() => {
    return ITEM_UI_CONFIG[this.selectedType()];
  });

  currentPreviewColumns = computed(() => {
    return this.currentTypeConfig().previewColumns;
  });

  currentActionConfig = computed<ItemActionConfig>(() => {
    return this.currentTypeConfig().actions;
  });

  currentEditableFields = computed(() => {
    return this.currentTypeConfig().editableFields;
  });

  searchPlaceholder = computed(() => {
    return this.currentTypeConfig().search.placeholder;
  });

  isUsersType = computed(() => this.selectedType() === 'users');
  isRoutesType = computed(() => this.selectedType() === 'routes');
  isPointsType = computed(() => this.selectedType() === 'points');
  isHistoryType = computed(() => this.selectedType() === 'history');
  isReviewsType = computed(() => this.selectedType() === 'reviews');

  isEditingUser = computed(() => this.editingUserId() !== null);
  isEditingRoute = computed(() => this.editingRouteId() !== null);
  isEditingPoint = computed(() => this.editingPointId() !== null);
  isEditingReview = computed(() => this.editingReviewId() !== null);
  modalTitle = computed(() => (this.isEditingUser() ? 'Edit user' : 'Add user'));
  routeModalTitle = computed(() => (this.isEditingRoute() ? 'Edit route' : 'Add route'));

  pointModalTitle = computed(() => (this.isEditingPoint() ? 'Edit point' : 'Add point'));
  reviewModalTitle = computed(() => (this.isEditingReview() ? 'Edit review' : 'Add review'));

  canAddCurrentType = computed(() => {
    if (this.isHistoryType()) {
      return false;
    }

    return Object.values(this.currentActionConfig()).some(Boolean);
  });

  addButtonLabel = computed(() => {
    return this.currentTypeConfig().addButtonLabel;
  });

  showSearchBar = computed(() => this.currentTypeConfig().search.enabled);

  showHistoryDetailsButton = computed(() => this.isHistoryType());

  entityCountCards = computed(() => {
    const counts = this.entityCounts();

    return this.typeOptions.map((type) => ({
      ...type,
      count: counts[type.value],
    }));
  });

  totalEntityCount = computed(() => {
    return Object.values(this.entityCounts()).reduce((sum, count) => sum + count, 0);
  });

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadEntityCounts();
    this.loadItems();
  }

  onLogout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.loggingOut.set(false);
        }),
      )
      .subscribe(() => {
        this.router.navigateByUrl('/login');
      });
  }

  onTypeChange(type: ItemType): void {
    this.selectedType.set(type);
    this.selectedIds.set([]);
    this.searchTerm.set('');
    this.isGlobalSearching.set(false);
    this.page.set(1);
    this.items.set([]);
    this.allItems.set([]);
    this.total.set(0);
    this.totalPages.set(0);
    this.closeUserModal();
    this.closeRouteModal();
    this.closePointModal();
    this.closeReviewModal();
    this.onCloseHistoryDetailsModal();
    this.loadItems();
  }

  onPageChange(page: number): void {
    this.page.set(page);

    const term = this.searchTerm().trim();
    const filter = term ? { [this.getSearchKey()]: term } : undefined;

    this.loadItems(filter);
  }

  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.page.set(1);

    const term = this.searchTerm().trim();
    const filter = term ? { [this.getSearchKey()]: term } : undefined;

    this.loadItems(filter);
  }

  onSearchTermChange(value: string): void {
    if (!this.currentTypeConfig().search.enabled) {
      return;
    }

    this.searchTerm.set(value);

    if (!value.trim()) {
      this.searching.set(false);
      this.loadItems();
      return;
    }

    const term = value.trim();
    const searchKey = this.getSearchKey();

    if (!searchKey) {
      this.loadItems();
      return;
    }

    this.page.set(1);
    this.searching.set(true);

    const filter = { [searchKey]: term };

    this.loadItems(filter);
  }

  private searchAcrossAllPages(): void {
    if (!this.currentTypeConfig().search.enabled) {
      return;
    }

    const term = this.searchTerm().trim().toLowerCase();
    const searchKey = this.getSearchKey();
    const itemType = this.selectedType();

    if (!term || !searchKey) {
      this.isGlobalSearching.set(false);
      this.searching.set(false);
      this.loadItems();
      return;
    }

    this.searching.set(true);
    this.isGlobalSearching.set(true);

    this.dataService.getAllItems(itemType, 50).subscribe({
      next: (allItems) => {
        const filteredItems = allItems.filter((item) => {
          const value = this.valueToSearchText(this.getItemValueByKey(item, searchKey));
          return value.includes(term);
        });

        this.allItems.set(allItems);
        this.items.set(filteredItems);
        this.total.set(filteredItems.length);
        this.totalPages.set(1);
        this.page.set(1);
        this.searching.set(false);
      },
      error: (error) => {
        console.error('Global search error:', error);
        this.searching.set(false);
        this.isGlobalSearching.set(false);
      },
    });
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.isGlobalSearching.set(false);
    this.loadItems();
  }

  onOpenAddItem(): void {
    if (this.isHistoryType()) {
      return;
    }

    if (this.selectedType() === 'users') {
      this.onOpenAddUser();
      return;
    }

    if (this.selectedType() === 'routes') {
      this.onOpenAddRoute();
      return;
    }

    if (this.selectedType() === 'points') {
      this.onOpenAddPoint();
      return;
    }

    if (this.selectedType() === 'reviews') {
      this.onOpenAddReview();
    }
  }

  onOpenEditItem(id: string): void {
    if (this.isHistoryType()) {
      return;
    }

    if (this.selectedType() === 'users') {
      this.onOpenEditUser(id);
      return;
    }

    if (this.selectedType() === 'routes') {
      this.onOpenEditRoute(id);
      return;
    }

    if (this.selectedType() === 'points') {
      this.onOpenEditPoint(id);
      return;
    }

    if (this.selectedType() === 'reviews') {
      this.onOpenEditReview(id);
      return;
    }
  }

  onOpenAddUser(): void {
    this.editingUserId.set(null);
    this.userForm.set({
      name: '',
      surname: '',
      username: '',
      email: '',
      password: '',
      enabled: true,
      role: 'user',
    });
    this.showUserModal.set(true);
  }

  onOpenEditUser(id: string): void {
    const item = this.items().find((user): user is UserItem => user._id === id);
    if (!item) return;

    this.editingUserId.set(id);
    this.userForm.set({
      name: item.name,
      surname: item.surname,
      username: item.username,
      email: item.email,
      password: '',
      enabled: item.enabled,
      role: item.role,
    });
    this.showUserModal.set(true);
  }

  onUserFieldChange<K extends keyof UserFormValue>(key: K, value: UserFormValue[K]): void {
    this.userForm.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  onCloseUserModal(): void {
    if (this.savingUser()) {
      return;
    }

    this.closeUserModal();
  }

  onSubmitUser(): void {
    if (!this.isUsersType()) return;

    const form = this.userForm();

    if (this.isEditingUser()) {
      const updatePayload: UpdateUserPayload = {
        name: form.name.trim(),
        surname: form.surname.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        enabled: form.enabled,
        role: form.role,
      };

      if (form.password.trim()) {
        updatePayload.password = form.password.trim();
      }

      this.savingUser.set(true);
      this.dataService.updateItem('users', this.editingUserId()!, updatePayload).subscribe({
        next: () => {
          this.savingUser.set(false);
          this.closeUserModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update user error:', error);
          this.savingUser.set(false);
        },
      });

      return;
    }

    const createPayload: CreateUserPayload = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
    };

    this.savingUser.set(true);
    this.dataService.createItem('users', createPayload).subscribe({
      next: () => {
        this.savingUser.set(false);
        this.closeUserModal();
        this.page.set(1);
        this.loadEntityCounts();
        this.loadItems();
      },
      error: (error) => {
        console.error('Create user error:', error);
        this.savingUser.set(false);
      },
    });
  }

  onOpenAddRoute(): void {
    this.editingRouteId.set(null);
    this.routeForm.set({
      name: '',
      description: '',
      city: '',
      country: '',
      distance: null,
      duration: null,
      difficulty: 'easy',
      tags: '',
      userId: '',
    });
    this.showRouteModal.set(true);
  }

  onOpenEditRoute(id: string): void {
    const item = this.items().find((route): route is RouteItem => route._id === id);
    if (!item) return;

    this.editingRouteId.set(id);
    this.routeForm.set({
      name: item.name,
      description: item.description,
      city: item.city,
      country: item.country,
      distance: item.distance,
      duration: item.duration,
      difficulty: item.difficulty,
      tags: item.tags.join(', '),
      userId: item.userId,
    });

    this.showRouteModal.set(true);
  }

  onRouteFieldChange<K extends keyof RouteFormValue>(key: K, value: RouteFormValue[K]): void {
    this.routeForm.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  onCloseRouteModal(): void {
    if (this.savingRoute()) {
      return;
    }

    this.closeRouteModal();
  }

  onSubmitRoute(): void {
    if (!this.isRoutesType()) return;

    const form = this.routeForm();

    const payload: CreateRoutePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      distance: form.distance === null ? 0 : Number(form.distance),
      duration: form.duration === null ? 0 : Number(form.duration),
      difficulty: form.difficulty,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      userId: form.userId.trim(),
    };

    this.savingRoute.set(true);

    if (this.isEditingRoute()) {
      this.dataService.updateItem('routes', this.editingRouteId()!, payload).subscribe({
        next: () => {
          this.savingRoute.set(false);
          this.closeRouteModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update route error:', error);
          this.savingRoute.set(false);
        },
      });

      return;
    }

    this.dataService.createItem('routes', payload).subscribe({
      next: () => {
        this.savingRoute.set(false);
        this.closeRouteModal();
        this.page.set(1);
        this.loadEntityCounts();
        this.loadItems();
      },
      error: (error) => {
        console.error('Create route error:', error);
        this.savingRoute.set(false);
      },
    });
  }

  onOpenAddPoint(): void {
    this.editingPointId.set(null);

    this.pointForm.set({
      name: '',
      description: '',
      latitude: null,
      longitude: null,
      image: '',
      routeId: '',
      index: null,
    });

    this.showPointModal.set(true);
  }

  onOpenEditPoint(id: string): void {
    const item = this.items().find((point): point is PointItem => point._id === id);

    if (!item) return;

    this.editingPointId.set(id);

    this.pointForm.set({
      name: item.name,
      description: item.description ?? '',
      latitude: item.latitude,
      longitude: item.longitude,
      image: item.image ?? '',
      routeId: item.routeId,
      index: item.index,
    });

    this.showPointModal.set(true);
  }

  onPointFieldChange<K extends keyof PointFormValue>(key: K, value: PointFormValue[K]): void {
    this.pointForm.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  onClosePointModal(): void {
    if (this.savingPoint()) {
      return;
    }

    this.closePointModal();
  }

  onSubmitPoint(): void {
    if (!this.isPointsType()) return;

    const form = this.pointForm();

    const payload: CreatePointPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      latitude: form.latitude === null ? 0 : Number(form.latitude),
      longitude: form.longitude === null ? 0 : Number(form.longitude),
      image: form.image.trim(),
      routeId: form.routeId.trim(),
      index: form.index === null ? 0 : Number(form.index),
    };

    this.savingPoint.set(true);

    if (this.isEditingPoint()) {
      this.dataService.updateItem('points', this.editingPointId()!, payload).subscribe({
        next: () => {
          this.savingPoint.set(false);
          this.closePointModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update point error:', error);
          this.savingPoint.set(false);
        },
      });

      return;
    }

    this.dataService.createItem('points', payload).subscribe({
      next: () => {
        this.savingPoint.set(false);
        this.closePointModal();
        this.page.set(1);
        this.loadEntityCounts();
        this.loadItems();
      },
      error: (error) => {
        console.error('Create point error:', error);
        this.savingPoint.set(false);
      },
    });
  }

  onOpenAddReview(): void {
    this.editingReviewId.set(null);

    this.reviewForm.set({
      title: '',
      comment: '',
      routeId: '',
      userId: '',
      ratings: [{ label: '', score: null }],
    });

    this.showReviewModal.set(true);
  }

  onOpenEditReview(id: string): void {
    const item = this.items().find((review): review is ReviewItem => review._id === id);

    if (!item) return;

    this.editingReviewId.set(id);

    this.reviewForm.set({
      title: item.title,
      comment: item.comment ?? '',
      routeId: item.routeId,
      userId: item.userId,
      ratings:
        item.ratings.length > 0
          ? item.ratings.map((rating) => ({
              label: rating.label,
              score: rating.score,
            }))
          : [{ label: '', score: null }],
    });

    this.showReviewModal.set(true);
  }

  onReviewFieldChange<K extends keyof ReviewFormValue>(key: K, value: ReviewFormValue[K]): void {
    this.reviewForm.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  onCloseReviewModal(): void {
    if (this.savingReview()) {
      return;
    }

    this.closeReviewModal();
  }

  onSubmitReview(): void {
    if (!this.isReviewsType()) return;

    const form = this.reviewForm();

    const ratings = form.ratings
      .map((rating) => ({
        label: rating.label.trim(),
        score: rating.score,
      }))
      .filter(
        (rating): rating is { label: string; score: number } =>
          rating.label.length > 0 && rating.score !== null && Number.isFinite(rating.score),
      );

    const payload: CreateReviewPayload = {
      title: form.title.trim(),
      comment: form.comment.trim(),
      routeId: form.routeId.trim(),
      userId: form.userId.trim(),
      ratings,
    };

    this.savingReview.set(true);

    if (this.isEditingReview()) {
      this.dataService.updateItem('reviews', this.editingReviewId()!, payload).subscribe({
        next: () => {
          this.savingReview.set(false);
          this.closeReviewModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update review error:', error);
          this.savingReview.set(false);
        },
      });

      return;
    }

    this.dataService.createItem('reviews', payload).subscribe({
      next: () => {
        this.savingReview.set(false);
        this.closeReviewModal();
        this.page.set(1);
        this.loadItems();
      },
      error: (error) => {
        console.error('Create review error:', error);
        this.savingReview.set(false);
      },
    });
  }

  onDeleteItem(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    this.dataService.deleteItem(this.selectedType(), id).subscribe({
      next: () => {
        this.selectedIds.update((current) => current.filter((selectedId) => selectedId !== id));
        this.loadEntityCounts();
        this.loadItems();
      },
      error: (error) => console.error('Delete item error:', error),
    });
  }

  onDeleteMany(ids: string[]): void {
    if (!ids.length) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${ids.length} items?`);
    if (!confirmed) return;

    this.dataService.deleteMany(this.selectedType(), ids).subscribe({
      next: () => {
        this.selectedIds.update((current) =>
          current.filter((selectedId) => !ids.includes(selectedId)),
        );
        this.loadEntityCounts();
        this.loadItems();
      },
      error: (error) => console.error('Bulk delete error:', error),
    });
  }

  onSelectedIdsChange(ids: string[]): void {
    this.selectedIds.set(ids);
  }

  onInlineEditSubmit(event: { itemId: string; changes: Record<string, string> }): void {
    const { itemId, changes } = event;

    if (this.isHistoryType()) {
      return;
    }

    if (Object.keys(changes).length === 0) {
      this.inlineEditCompletedItemId.set(itemId);
      return;
    }

    this.inlineEditSavingItemId.set(itemId);
    this.inlineEditCompletedItemId.set(null);

    const type = this.selectedType();

    if (type === 'users') {
      const payload = buildUserInlineUpdatePayload(changes);
      this.dataService.updateItem('users', itemId, payload).subscribe({
        next: () => {
          this.inlineEditSavingItemId.set(null);
          this.inlineEditCompletedItemId.set(itemId);
          this.loadItems();
        },
        error: (error) => {
          console.error('Inline edit user error:', error);
          this.inlineEditSavingItemId.set(null);
        },
      });
      return;
    }

    if (type === 'routes') {
      const payload = buildRouteInlineUpdatePayload(changes);
      this.dataService.updateItem('routes', itemId, payload).subscribe({
        next: () => {
          this.inlineEditSavingItemId.set(null);
          this.inlineEditCompletedItemId.set(itemId);
          this.loadItems();
        },
        error: (error) => {
          console.error('Inline edit route error:', error);
          this.inlineEditSavingItemId.set(null);
        },
      });
      return;
    }

    if (type === 'points') {
      const payload = buildPointInlineUpdatePayload(changes);
      this.dataService.updateItem('points', itemId, payload).subscribe({
        next: () => {
          this.inlineEditSavingItemId.set(null);
          this.inlineEditCompletedItemId.set(itemId);
          this.loadItems();
        },
        error: (error) => {
          console.error('Inline edit point error:', error);
          this.inlineEditSavingItemId.set(null);
        },
      });
    }

    if (type === 'reviews') {
      const payload = buildReviewInlineUpdatePayload(changes);
      this.dataService.updateItem('reviews', itemId, payload).subscribe({
        next: () => {
          this.inlineEditSavingItemId.set(null);
          this.inlineEditCompletedItemId.set(itemId);
          this.loadItems();
        },
        error: (error) => {
          console.error('Inline edit review error:', error);
          this.inlineEditSavingItemId.set(null);
        },
      });
      return;
    }
  }

  onToggleEnabled(itemId: string): void {
    const item = this.items().find((i): i is UserItem => i._id === itemId);

    if (item) {
      this.toggleEnabled(item);
    }
  }

  onViewHistoryDetails(itemId: string): void {
    if (!this.isHistoryType()) {
      return;
    }

    const item = this.items().find((history): history is HistoryItem => history._id === itemId);

    if (!item) {
      return;
    }

    this.selectedHistoryItem.set(item);
    this.showHistoryDetailsModal.set(true);
  }

  onCloseHistoryDetailsModal(): void {
    this.showHistoryDetailsModal.set(false);
    this.selectedHistoryItem.set(null);
  }

  private closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUserId.set(null);
    this.savingUser.set(false);
  }

  private closeRouteModal(): void {
    this.showRouteModal.set(false);
    this.editingRouteId.set(null);
    this.savingRoute.set(false);
  }

  private closePointModal(): void {
    this.showPointModal.set(false);
    this.editingPointId.set(null);
    this.savingPoint.set(false);
  }

  private closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.editingReviewId.set(null);
    this.savingReview.set(false);
  }

  private loadItems(filters?: Record<string, unknown>): void {
    this.loading.set(true);

    const requestedType = this.selectedType();
    const page = this.page();
    const limit = this.limit();

    this.dataService.getItems(requestedType, page, limit, filters).subscribe({
      next: (response) => {
        if (this.selectedType() !== requestedType) {
          return;
        }

        this.allItems.set(response.data);
        this.items.set(response.data);
        this.page.set(Math.max(1, response.page));
        this.limit.set(Math.max(1, response.limit));
        this.total.set(Math.max(0, response.total));
        this.totalPages.set(Math.max(1, response.totalPages));
        this.updateEntityCount(requestedType, response.total);
        this.loading.set(false);
        this.searching.set(false);
      },
      error: (error) => {
        if (this.selectedType() !== requestedType) {
          return;
        }

        console.error('Load items error:', error);
        this.loading.set(false);
        this.searching.set(false);
      },
    });
  }

  private applyLocalFilter(): void {
    if (!this.currentTypeConfig().search.enabled) {
      this.items.set(this.allItems());
      return;
    }

    const term = this.searchTerm().trim().toLowerCase();
    const sourceItems = this.allItems();
    const searchKey = this.getSearchKey();

    if (!term || !searchKey) {
      this.items.set(sourceItems);
      return;
    }

    const filteredItems = sourceItems.filter((item) => {
      const value = this.valueToSearchText(this.getItemValueByKey(item, searchKey));
      return value.includes(term);
    });

    this.items.set(filteredItems);
  }

  private getSearchKey(): string {
    return this.currentTypeConfig().search.key;
  }

  private getItemValueByKey(item: ItemModel, key: string): unknown {
    return (item as unknown as Record<string, unknown>)[key];
  }

  private valueToSearchText(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.toLowerCase();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).toLowerCase();
    return '';
  }

  private toggleEnabled(item: UserItem): void {
    if (this.selectedType() !== 'users') {
      return;
    }

    this.dataService
      .updateItem('users', item._id, {
        enabled: !item.enabled,
      })
      .subscribe({
        next: () => this.loadItems(),
        error: (error) => console.error('Toggle enabled error:', error),
      });
  }

  private loadEntityCounts(): void {
    this.entityCountsLoading.set(true);
    const countLimit = this.limit();

    const requests = this.typeOptions.map((type) =>
      this.dataService.getItems(type.value, 1, countLimit).pipe(
        map((response) => [type.value, Math.max(0, response.total, response.data.length)] as const),
        catchError((error) => {
          console.error(`Load ${type.value} count error:`, error);
          return of([type.value, this.entityCounts()[type.value]] as const);
        }),
      ),
    );

    forkJoin(requests)
      .pipe(finalize(() => this.entityCountsLoading.set(false)))
      .subscribe((entries) => {
        const nextCounts = { ...this.entityCounts() };

        for (const [type, count] of entries) {
          nextCounts[type] = count;
        }

        this.entityCounts.set(nextCounts);
      });
  }

  private updateEntityCount(type: ItemType, count: number): void {
    this.entityCounts.update((current) => ({
      ...current,
      [type]: Math.max(0, count),
    }));
  }
}
