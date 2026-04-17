# HUBDrive Data Schema & Rules

## Description
Defines HUBDrive entities, required fields, statuses, and event taxonomy. Type-first approach.

## Принцип
Сначала типы/контракты данных, потом экраны.
Все экраны обязаны потреблять строго типизированные данные.

## Ключевые сущности

### User
- telegramId (string)
- username (string | null)
- name (string | null)
- phone (string | null)
- city (string | null)
- createdAt
- lastActiveAt

### Filter (на пользователя без лимита)
- id
- userId (telegramId)
- title (string | null)
- brand (required)
- model (optional)
- bodyTypes (multi | optional)
- yearFrom (optional)
- yearTo (optional)
- budgetMax (required)  // для уведомлений
- budgetMin (optional)  // для каталога/аналитики
- engineTypes (multi | optional) // бенз/диз/гибрид/электро
- engineVolumeFrom/To (optional)
- drivetrain (multi | optional)
- transmission (multi | optional)
- exteriorColors (multi | optional)
- interiorColors (multi | optional)
- mileageMax (optional)
- onlyNew (optional boolean)
- purchasePlan (required): browsing | 3_months | ready_now
- notificationsEnabled (boolean)
- isActive (boolean) // активен ли поиск по фильтру

- createdAt/updatedAt

### Vehicle
- id
- brand (required)
- model (required)
- generation (optional) // G05 etc
- year (required)
- bodyType (required)
- engineType (required)
- engineVolume (optional)
- powerHp (optional)
- transmission (required)
- drivetrain (required)
- mileage (optional)
- exteriorColor (optional)
- interiorColor (optional)
- trimOptions (list)
- priceKeyTurnKZT (required) // цена под ключ
- priceChina (optional)
- deliveryEtaWeeks (optional)
- paymentOptions (list)
- status (required): in_stock | in_transit | reserved | sold | hidden
- media: photos[], videos[]
- description (string)
- createdAt/updatedAt

### Favorite
- userId
- vehicleId
- createdAt

### Notification
- id
- type: user | manager
- userId (optional)
- filterId (optional)
- vehicleId (optional)
- text
- deliveryStatus: pending | sent | failed
- createdAt

### Event (аналитика)
- id
- userId (optional)
- vehicleId (optional)
- filterId (optional)
- type:
  - filter_created
  - filter_updated
  - vehicle_opened
  - contact_clicked
  - call_clicked
  - favorite_added
  - favorite_removed
  - notification_sent_user
  - notification_sent_manager
- createdAt
- meta (json)

## Правила статусов авто (UI)
- in_stock / in_transit показывать в основном каталоге
- sold показывать в "Недавно продано" или с плашкой
- hidden не показывать пользователям нигде

## Примечание по данным
- Все финансовые значения в KZT (в типах явно).
- В UI нельзя "додумывать" поля.
- Любое новое поле — сначала добавляется в types, затем в storage, затем в UI.
