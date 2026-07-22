# Поддерживаемый CSS subset email-renderer

Ядро генерирует основную стилизацию inline. В `<style>` остаются только reset, Outlook-совместимые правила и один мобильный media query. Это осознанно ограниченный subset для Gmail, Outlook и Apple Mail.

## Inline-свойства

- Цвета: `background-color`, `border-color`, `color`; только формат `#RRGGBB`.
- Рамки: `border-width`, `border-style`, `border-radius`.
- Типографика: `font-family` из доменного allowlist, `font-size`, `font-weight`, `line-height`, `text-align`, `text-decoration`.
- Размеры: `width`, `max-width`, `height`; числа сериализуются в `px`, ширина также допускает `100%`.
- Box model: `padding`, `margin` с одним, двумя или четырьмя неотрицательными значениями в `px`.
- Layout: `display`, `vertical-align`, `overflow-wrap`.
- Outlook: `mso-line-height-rule`, `mso-padding-alt`.

Произвольные CSS-строки не принимаются публичным API. Новое свойство добавляется только через тип `EmailStyle`, отдельную валидацию и contract test.

## CSS в document shell

- Нормализация отступов документа и table spacing.
- Запрет автоматического изменения размера текста в мобильных клиентах.
- Bicubic interpolation изображений в Outlook.
- `.email-container`, `.mobile-padding` и `.fluid-image` для viewport до `620px`.

## Ограничения

- Не используются flexbox, grid, positioning, CSS variables, gradients, filters и animations.
- Основной layout строится presentation-таблицами.
- Интерактивность, JavaScript и внешние stylesheets запрещены.
- Media query является улучшением: письмо остается читаемым в клиентах без его поддержки.
- Скругление CTA может отсутствовать в старых Outlook; VML fallback сохраняет форму и кликабельность.
