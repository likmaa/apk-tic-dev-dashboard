import React from 'react'

export default function DeveloperToolsPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Espace développeur</h1>
      <ul>
        <li>Documentation API (OpenAPI)</li>
        <li>Explorateur des logs (backend, mobile)</li>
        <li>Feature flags / configuration</li>
        <li>Testeur de webhooks</li>
        <li>État des migrations / santé des services</li>
        <li>Preview sandbox (staging)</li>
      </ul>
      <p>Prochaine étape: relier aux endpoints et outils existants.</p>
    </div>
  )
}
