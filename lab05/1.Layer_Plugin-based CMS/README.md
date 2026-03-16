# Plugin-Based CMS — Layered Architecture (Node.js)

Zero external dependencies. Pure Node.js built-in modules only.

## Quick Start

```bash
node src/app.js
# Open http://localhost:3000
# Login: admin@cms.local / admin123
```

## Architecture

```
src/
├── app.js                          ← Entry point, wires all layers
├── core/
│   └── pluginManager.js            ← Plugin registry + hook engine
├── layers/
│   ├── presentation/               ← HTTP, routing, views, controllers
│   │   ├── router.js               ← Pure Node.js HTTP router
│   │   ├── middleware.js           ← Auth middleware + compose
│   │   ├── controllers.js          ← Request handlers
│   │   └── views.js                ← HTML templates
│   ├── business/                   ← Business logic (no HTTP knowledge)
│   │   ├── authService.js          ← Login, register, sessions
│   │   ├── postService.js          ← Post CRUD + hook calls
│   │   └── pluginService.js        ← Plugin lifecycle management
│   └── infrastructure/             ← DB, crypto (no business logic)
│       ├── database.js             ← JSON file persistence
│       └── crypto.js               ← Node.js crypto utils
└── plugins/
    ├── seo-plugin/index.js         ← SEO metadata via hooks
    └── analytics-plugin/index.js   ← View tracking via hooks
```

## 3 Core Features

### 1. Post Management
- Create, Read, Update, Delete posts
- Draft / Published status toggle
- Tags, slug auto-generation, author tracking

### 2. User Authentication
- Secure password hashing (scrypt via built-in crypto)
- Session tokens (stored server-side)
- Role-based access: admin / editor

### 3. Plugin Manager
- Enable/disable plugins at runtime
- Hook-based event system (pipeline pattern)
- Built-in plugins:
  - **SEO Optimizer**: hooks `before_post_save`, `after_post_update`
  - **Analytics Tracker**: hooks `post_view`, `after_post_save`, `before_post_delete`

## Writing a Plugin

```js
module.exports = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Does something cool',

  hooks: {
    before_post_save: async (post) => {
      post.myField = 'injected!';
      return post; // pass through pipeline
    }
  },

  onActivate: async () => console.log('Plugin activated'),
  onDeactivate: async () => console.log('Plugin deactivated')
};
```

Then register in `app.js`:
```js
pluginManager.register(require('./plugins/my-plugin'));
```

## Available Hooks

| Hook               | Triggered                        | Data        |
|--------------------|----------------------------------|-------------|
| `before_post_save` | Before inserting new post        | post object |
| `after_post_save`  | After inserting new post         | post object |
| `after_post_update`| After updating a post            | post object |
| `before_post_delete`| Before deleting a post          | post object |
| `post_view`        | When a post page is opened       | post object |
