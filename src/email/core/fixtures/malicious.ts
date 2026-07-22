export const MALICIOUS_TEXT = `Hello <script>alert('owned')</script> & goodbye`;
export const MALICIOUS_ATTRIBUTE = `logo" onerror="alert(1)<script>`;

export const MALICIOUS_URLS = [
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'https://example.com/space here',
] as const;
