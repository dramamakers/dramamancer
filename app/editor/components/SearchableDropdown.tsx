/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export interface DropdownOption<T = any> {
  type: 'item' | 'create' | 'clear';
  item?: T;
  label?: string;
}

interface BaseSearchableDropdownProps<T> {
  // Display
  placeholder: string;
  emptyStateText?: string;
  noResultsText?: string;
  clearSelectionText?: string;

  // Data
  items: T[];
  getItemId: (item: T) => string;
  getItemName: (item: T) => string;
  getItemDescription?: (item: T) => string;
  filterItems: (items: T[], searchValue: string) => T[];

  // Rendering
  renderItemOption: (item: T, isHighlighted: boolean, onClick: () => void) => React.ReactNode;

  // Actions
  onCreateNew?: (name: string) => void;

  // Configuration
  allowCreate?: boolean;
}

interface MultiSelectDropdownProps<T> extends BaseSearchableDropdownProps<T> {
  selectedItems: T[];
  renderSelectedDisplay: (selectedItems: T[], onClick: () => void) => React.ReactNode;
  onItemToggle: (item: T) => void;
  multiSelect: true;
  allowClear?: never;
  onClear?: never;
  selectedItem?: never;
  onItemSelect?: never;
}

interface SingleSelectDropdownProps<T> extends BaseSearchableDropdownProps<T> {
  selectedItem?: T;
  renderSelectedDisplay: (selectedItem: T | undefined, onClick: () => void) => React.ReactNode;
  onItemSelect: (item: T) => void;
  onClear?: () => void;
  allowClear?: boolean;
  multiSelect?: false;
  selectedItems?: never;
  onItemToggle?: never;
}

type SearchableDropdownProps<T> = MultiSelectDropdownProps<T> | SingleSelectDropdownProps<T>;

export function SearchableDropdown<T>(props: SearchableDropdownProps<T>) {
  const {
    placeholder,
    emptyStateText = 'No items created yet',
    noResultsText = 'No items found',
    items,
    getItemName,
    filterItems,
    renderSelectedDisplay,
    renderItemOption,
    onCreateNew,
    clearSelectionText = 'Clear selection',
    allowCreate = false,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMultiSelect = 'multiSelect' in props && props.multiSelect;
  const selectedItems = props.selectedItems ?? [];
  const selectedItem = props.selectedItem;
  const allowClear = props.allowClear;
  const onItemSelect = props.onItemSelect;
  const onItemToggle = props.onItemToggle;
  const onClear = props.onClear;

  const filteredItems = filterItems(items, searchValue);

  // Check if search value would create a new item
  const wouldCreateNew =
    allowCreate &&
    searchValue.trim() &&
    !items.some((item) => getItemName(item).toLowerCase() === searchValue.trim().toLowerCase());

  // Build options for keyboard navigation
  const allOptions: DropdownOption<T>[] = [
    ...(allowClear && (selectedItem || (selectedItems && selectedItems.length > 0))
      ? [{ type: 'clear' as const, label: clearSelectionText || 'Clear selection' }]
      : []),
    ...(wouldCreateNew ? [{ type: 'create' as const, label: `Create "${searchValue}"` }] : []),
    ...filteredItems.map((item) => ({ type: 'item' as const, item })),
  ];

  const handleItemAction = (item: T) => {
    if (isMultiSelect && onItemToggle) {
      onItemToggle(item);
    } else if (onItemSelect) {
      onItemSelect(item);
      closeDropdown();
    }
  };

  const handleCreateNew = () => {
    if (onCreateNew && searchValue.trim()) {
      onCreateNew(searchValue.trim());
      closeDropdown();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
      closeDropdown();
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchValue('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
          const option = allOptions[highlightedIndex];
          if (option.type === 'clear') {
            handleClear();
          } else if (option.type === 'create') {
            handleCreateNew();
          } else if (option.type === 'item' && option.item) {
            handleItemAction(option.item);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchValue]);

  return (
    <div className="w-full">
      <div className="relative" ref={dropdownRef}>
        {isMultiSelect
          ? (renderSelectedDisplay as any)(selectedItems, () => setIsOpen(!isOpen))
          : (renderSelectedDisplay as any)(selectedItem, () => setIsOpen(!isOpen))}

        {isOpen && (
          <div className="z-[5] bg-white dark:bg-slate-800 absolute top-full left-0 right-0 mt-1 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full p-2 rounded bg-white! dark:bg-slate-800!"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {allOptions.map((option, index) => {
                const isHighlighted = highlightedIndex === index;

                if (option.type === 'clear') {
                  return (
                    <button
                      key="clear"
                      type="button"
                      onClick={handleClear}
                      className={twMerge(
                        'w-full p-2 text-sm text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 cursor-pointer h-10',
                        isHighlighted
                          ? 'bg-slate-100 dark:bg-slate-700'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                }

                if (option.type === 'create') {
                  return (
                    <button
                      key="create"
                      type="button"
                      onClick={handleCreateNew}
                      className={twMerge(
                        'w-full p-3 text-left border-b border-slate-200 dark:border-slate-700 cursor-pointer',
                        isHighlighted
                          ? 'bg-slate-100 dark:bg-slate-700'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                          <PlusIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div>{option.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">New item</div>
                        </div>
                      </div>
                    </button>
                  );
                }

                if (option.type === 'item' && option.item) {
                  return renderItemOption(option.item, isHighlighted, () =>
                    handleItemAction(option.item!),
                  );
                }

                return null;
              })}

              {/* Empty states */}
              {filteredItems.length === 0 && !wouldCreateNew && searchValue.trim() && (
                <div className="p-3 text-slate-500 dark:text-slate-400 text-center">
                  {noResultsText}
                </div>
              )}

              {items.length === 0 && !searchValue.trim() && (
                <div className="p-3 text-slate-500 dark:text-slate-400 text-center">
                  {emptyStateText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
