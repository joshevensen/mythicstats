# UI Components

## Overview
Create reusable UI components for status badges, rate limit indicators, and other common elements.

## Step-by-Step Plan

### 1. Create Status Badge Component

**File**: `resources/views/components/status_badge.edge`

**Purpose**: Display tracked/untracked, active/inactive status

**Implementation**:
```edge
@if(status === 'tracked' || status === 'active')
  <span class="badge badge-success">{{ label }}</span>
@elseif(status === 'untracked' || status === 'inactive')
  <span class="badge badge-secondary">{{ label }}</span>
@else
  <span class="badge">{{ label }}</span>
@end
```

**Usage**:
```edge
@include('components/status_badge', { status: game.isTracked ? 'tracked' : 'untracked', label: game.isTracked ? 'Tracked' : 'Not Tracked' })
```

---

### 2. Create Rate Limit Indicator Component

**File**: `resources/views/components/rate_limit_indicator.edge`

**Purpose**: Display rate limit status with color coding

**Implementation**:
```edge
@if(remaining > 50)
  <span class="rate-limit rate-limit-good">{{ remaining }} remaining</span>
@elseif(remaining > 10)
  <span class="rate-limit rate-limit-warning">{{ remaining }} remaining</span>
@else
  <span class="rate-limit rate-limit-danger">{{ remaining }} remaining</span>
@end
```

**Usage**:
```edge
@include('components/rate_limit_indicator', { remaining: apiStatus.monthly.remaining })
```

---

### 3. Create Price Display Component

**File**: `resources/views/components/price_display.edge`

**Purpose**: Format and display prices consistently

**Implementation**:
```edge
${{ price.toFixed(2) }}
@if(change)
  <span class="price-change {{ change > 0 ? 'positive' : 'negative' }}">
    ({{ change > 0 ? '+' : '' }}{{ change.toFixed(2) }}%)
  </span>
@end
```

**Usage**:
```edge
@include('components/price_display', { price: variant.price, change: variant.priceChange7d })
```

---

### 4. Create Inventory Value Calculation Component

**File**: `resources/views/components/inventory_value.edge`

**Purpose**: Display inventory value calculations

**Implementation**:
```edge
<div class="inventory-value">
  <div class="total-quantity">Quantity: {{ totalQuantity }}</div>
  <div class="total-value">Value: ${{ totalValue.toFixed(2) }}</div>
</div>
```

---

### 5. Create Confirmation Dialog Component

**File**: `resources/views/components/confirm_dialog.edge`

**Purpose**: Reusable confirmation dialog for destructive actions

**Implementation**: JavaScript-based confirmation (simple `confirm()` or custom modal)

**Usage**:
```edge
<button onclick="return confirm('Are you sure?')">Delete</button>
```

---

### 6. Create Timestamp Display Component

**File**: `resources/views/components/timestamp.edge`

**Purpose**: Format timestamps consistently

**Implementation**:
```edge
@if(timestamp)
  {{ timestamp.toFormat('MMM dd, yyyy HH:mm') }}
  <span class="timestamp-relative">({{ timestamp.toRelative() }})</span>
@else
  <span class="text-muted">Never</span>
@end
```

---

### 7. Create Pagination Component

**File**: `resources/views/components/pagination.edge`

**Purpose**: Pagination for lists

**Implementation**: Standard pagination links

---

## Testing

Test components:

```bash
# Start dev server
npm run dev

# View pages with components
# Verify components render correctly
# Check styling and formatting
```

---

## Completion Checklist

- [ ] Status badge component created
- [ ] Rate limit indicator component created
- [ ] Price display component created
- [ ] Inventory value component created
- [ ] Confirmation dialog component created
- [ ] Timestamp display component created
- [ ] Pagination component created
- [ ] Components used in views
- [ ] Components tested

