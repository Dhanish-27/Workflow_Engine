# Workflow Engine - Role-Based Workflow Automation System

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.0+-092E20?style=for-the-badge&logo=django" alt="Django">
  <img src="https://img.shields.io/badge/DRF-3.15+-092E20?style=for-the-badge&logo=django" alt="DRF">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/JWT-SimpleJWT-000000?style=for-the-badge" alt="JWT">
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
</p>

A powerful, graph-based workflow automation system built with Django and React. This system enables dynamic creation and execution of multi-step workflows with role-based access control, condition evaluation, and visual workflow building.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Workflow Execution Flow](#workflow-execution-flow)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Flowchart](#flowchart)

---

## 🚀 Project Overview

This is a **Role-Based Workflow Automation System** that allows organizations to create, manage, and execute dynamic workflows. Unlike traditional linear workflow systems, this platform uses a **graph-based execution engine** that supports:

- **Dynamic Workflows**: No fixed order - workflows are defined as directed graphs
- **Multiple Step Types**: Approval, Task, and Notification steps
- **Rule Engine**: Condition-based routing with priority evaluation
- **Loop Support**: Steps can repeat based on conditions
- **Role-Based Access Control**: Fine-grained permissions for different user roles
- **Visual Builder**: React-based workflow designer

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Django 5.0+ |
| **API Framework** | Django REST Framework |
| **Authentication** | JWT (Simple JWT) |
| **Frontend** | React 18+ |
| **UI Framework** | Tailwind CSS |
| **Database** | PostgreSQL / SQLite (development) |
| **State Management** | Zustand |
| **Email** | Django Email Backend |

---

## ✨ Core Features

### 1. Dynamic Workflow Builder

The workflow builder allows administrators to create complex, non-linear workflows:

- **Graph-Based Design**: Steps (nodes) connected by rules (edges)
- **Visual Editor**: Drag-and-drop interface in React
- **Version Control**: Workflows support versioning
- **Start/End Steps**: Define workflow entry and exit points

### 2. Step Types

| Step Type | Description | Behavior |
|-----------|-------------|----------|
| **Approval** | Requires approval from authorized personnel | Pauses execution until approved/rejected |
| **Task** | Assigns a task to a user or role | Pauses until task is completed |
| **Notification** | Sends notifications | Auto-completes after sending |

#### Approval Sub-Types

- `general` - General approval (any manager)
- `manager_approval` - Requires Manager role
- `finance_approval` - Requires Finance role
- `ceo_approval` - Requires CEO role

### 3. Rule Engine

Rules determine the flow between steps based on conditions:

- **Default Rule**: Fallback rule when no conditions match
- **Condition Rules**: Evaluate workflow data to determine next step
- **Priority-Based**: Rules are evaluated by priority order

### 4. Condition System

The condition evaluator supports the following operators:

| Operator | Symbol | Description |
|----------|--------|-------------|
| `gt` | `>` | Greater than |
| `lt` | `<` | Less than |
| `gte` | `>=` | Greater than or equal |
| `lte` | `<=` | Less than or equal |
| `eq` | `==` | Equal |
| `neq` | `!=` | Not equal |
| `equals` | `=` | Case-insensitive equal |
| `not_equals` | `≠` | Case-insensitive not equal |
| `contains` | - | Contains substring |
| `starts_with` | - | Starts with substring |
| `ends_with` | - | Ends with substring |
| `is_true` | - | Is true |
| `is_false` | - | Is false |
| `before` | - | Date is before |
| `after` | - | Date is after |

**Logical Operators**: `AND` / `OR` for combining multiple conditions

### 5. Loop Support

Steps can repeat based on workflow data conditions:

- Steps can loop back to previous steps
- Useful for approval retry loops
- Task reassignment scenarios

### 6. Loop Safety

To prevent infinite loops, the system implements safety limits:

- **Max 5 iterations** per step (loop limit)
- **Max 50 total steps** per execution
- Workflow fails if limits exceeded

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Workflow    │  │ Execution   │  │ Visual Builder          │  │
│  │ Dashboard   │  │ Monitor     │  │ (Drag & Drop)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Django Backend                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Django REST Framework                     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐   │
│  │ Workflows │ │   Steps   │ │   Rules    │ │  Executions    │   │
│  │   App     │ │   App     │ │   App      │ │     App        │   │
│  └───────────┘ └───────────┘ └───────────┘ └────────────────┘   │
│  ┌───────────┐ ┌───────────┐ ┌─────────────────────────────┐    │
│  │ Accounts  │ │  Emails   │ │   Notifications App         │    │
│  │   App     │ │   App     │ │                             │    │
│  └───────────┘ └───────────┘ └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL/SQLite)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ User    │ │Workflow │ │  Step   │ │  Rule   │ │Execution│   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Permissions

The system implements a comprehensive Role-Based Access Control (RBAC) system with five distinct roles:

| Role | Description |
|------|-------------|
| **Admin** | Full system access, can manage all workflows, steps, rules, and users |
| **Manager** | Can approve requests, view assigned workflows |
| **Employee** | Can create requests, submit workflow data, view own requests |
| **Finance** | Can approve financial steps, handle finance-related tasks |
| **CEO** | Final approval authority for high-value requests |

### Detailed Permission Matrix

| Permission | Admin | Manager | Employee | Finance | CEO |
|------------|-------|---------|----------|---------|-----|
| Create Workflows | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Workflows | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Workflows | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Steps | ✅ | ❌ | ❌ | ❌ | ❌ |
| Define Rules | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Start Workflow | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve (General) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Approve (Manager) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Approve (Finance) | ✅ | ❌ | ❌ | ✅ | ✅ |
| Approve (CEO) | ✅ | ❌ | ❌ | ❌ | ✅ |
| View All Executions | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Own Executions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel Executions | ✅ | ❌ | ❌ | ❌ | ❌ |
| Retry Failed Executions | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔄 Workflow Execution Flow

The workflow execution follows a graph-based traversal algorithm:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Execution Flowchart                         │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   START      │
    │  Workflow    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Execute Step │────► Step Type: Approval/Task/Notification
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────┐
    │   Step Requires Action?      │
    └──────┬───────────────────────┘
           │
      ┌────┴────┐
      │         │
     YES        NO
      │         │
      ▼         ▼
┌─────────┐  ┌─────────────────────────────────────┐
│  WAIT   │  │  Evaluate Rules (Priority Order)   │
│         │  └─────────────────┬───────────────────┘
└─────────┘                    │
                               ▼
                   ┌───────────────────────────┐
                   │  Condition Matches?       │
                   └─────────────┬─────────────┘
                              │
                         ┌────┴────┐
                         │         │
                        YES        NO
                         │         │
                         ▼         ▼
              ┌──────────────┐  ┌──────────────────┐
              │ Move to Next │  │ Check Default    │
              │ Step         │  │ Rule             │
              └──────────────┘  └────────┬─────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Has Default Rule?   │
                              └──────────┬──────────┘
                                         │
                                    ┌────┴────┐
                                   YES        NO
                                    │         │
                                    ▼         ▼
                          ┌──────────────┐  ┌──────────┐
                          │ Move to Next │  │  FAIL    │
                          │ Step         │  │  (No     │
                          └──────────────┘  │  Path)   │
                                           └──────────┘
```

### Step-by-Step Execution

1. **Workflow Initialization**
   - Workflow starts from the designated start step
   - Initial data is captured from workflow fields

2. **Step Execution**
   - **Approval Step**: Execution pauses, notifications sent to approvers
   - **Task Step**: Task created, execution pauses until completion
   - **Notification Step**: Auto-completes, sends notifications

3. **Rule Evaluation**
   - Rules are evaluated in priority order (lowest first)
   - Condition-based rules are checked against execution data
   - If no condition rules match, the default rule is used

4. **Transition**
   - If a matching rule is found, workflow moves to the next step
   - If no rules match and no default exists, workflow fails
   - Loop detection prevents infinite execution

5. **Completion**
   - When no more steps exist, workflow marks as completed
   - Completion notifications sent to stakeholders

---

## 🏁 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+ (optional, SQLite for development)

### Backend Setup

1. **Clone the repository**
   ```bash
   cd workflow_engine
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/

### Docker Setup (Alternative)

```bash
# Using docker-compose
docker-compose up -d
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (get tokens) |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows/` | List all workflows |
| POST | `/api/workflows/` | Create workflow |
| GET | `/api/workflows/{id}/` | Get workflow details |
| PUT | `/api/workflows/{id}/` | Update workflow |
| DELETE | `/api/workflows/{id}/` | Delete workflow |
| POST | `/api/workflows/{id}/execute/` | Start workflow execution |

### Steps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/steps/` | List all steps |
| POST | `/api/steps/` | Create step |
| GET | `/api/steps/{id}/` | Get step details |
| PUT | `/api/steps/{id}/` | Update step |
| DELETE | `/api/steps/{id}/` | Delete step |

### Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rules/` | List all rules |
| POST | `/api/rules/` | Create rule |
| GET | `/api/rules/{id}/` | Get rule details |
| PUT | `/api/rules/{id}/` | Update rule |
| DELETE | `/api/rules/{id}/` | Delete rule |

### Executions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/executions/` | List executions |
| POST | `/api/executions/` | Start execution |
| GET | `/api/executions/{id}/` | Get execution details |
| POST | `/api/executions/{id}/approve/` | Approve step |
| POST | `/api/executions/{id}/reject/` | Reject step |
| POST | `/api/executions/{id}/cancel/` | Cancel execution |
| POST | `/api/executions/{id}/retry/` | Retry failed execution |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List users (admin) |
| POST | `/api/users/` | Create user (admin) |
| GET | `/api/users/{id}/` | Get user details |
| PUT | `/api/users/{id}/` | Update user |
| DELETE | `/api/users/{id}/` | Delete user |

---

## 📂 Project Structure

```
HALLEYX/
├── frontend/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # Layout components
│   │   │   │   ├── MainLayout.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── ui/                   # UI Components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── WorkflowBuilder.jsx
│   │   │   │   ├── WorkflowVisualizer.jsx
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── pages/                    # Page Components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Workflows.jsx
│   │   │   ├── Steps.jsx
│   │   │   ├── Rules.jsx
│   │   │   ├── Executions.jsx
│   │   │   ├── Approvals.jsx
│   │   │   └── ...
│   │   ├── services/                 # API Services
│   │   │   ├── api.js
│   │   │   └── notifications.js
│   │   ├── store/                    # State Management
│   │   │   ├── index.js
│   │   │   └── workflowStore.js
│   │   └── utils/                    # Utilities
│   ├── package.json
│   └── tailwind.config.js
│
├── workflow_engine/                  # Django Backend
│   ├── apps/
│   │   ├── accounts/                 # User authentication & management
│   │   │   ├── models.py             # User model with roles
│   │   │   ├── permissions.py        # RBAC permissions
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── workflows/                # Workflow definitions
│   │   │   ├── models.py              # Workflow & WorkflowField models
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── validators.py
│   │   │   └── urls.py
│   │   ├── steps/                     # Step definitions
│   │   │   ├── models.py              # Step & TaskDefinition models
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── rules/                     # Rule engine
│   │   │   ├── models.py              # Rule & RuleCondition models
│   │   │   ├── serializers.py
│   │   │   ├── services/
│   │   │   │   └── rule_engine.py     # Rule evaluation logic
│   │   │   └── views.py
│   │   ├── executions/                # Workflow execution
│   │   │   ├── models.py              # Execution models
│   │   │   ├── graph_engine.py        # Graph-based execution engine
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── notifications/             # In-app notifications
│   │   ├── emails/                   # Email services
│   │   └── common/                   # Common utilities
│   ├── workflow_engine/              # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## 📊 Flowchart

Here's a sample workflow flowchart showing a typical approval process:

```mermaid
graph TD
    A([Start: Employee Request]) --> B{Manager Approval}
    
    B -->|amount > 1000| C[CEO Approval]
    B -->|amount <= 1000| D{Finance Approval}
    
    D -->|needs_correction == true| E[Task: Fix Details]
    E -->|completed == false| D
    E -->|completed == true| C
    
    C -->|approved| F[End: Notification]
    C -->|rejected| G[End: Rejection Notice]
    
    B -->|rejected| G
    D -->|rejected| G
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style G fill:#ffcdd2
    style C fill:#fff9c4
    style E fill:#f3e5f5
```

### Flow Explanation

1. **Employee submits request** → Workflow starts
2. **Manager Approval** → 
   - If `amount > 1000` → Escalate to CEO
   - If `amount <= 1000` → Send to Finance
3. **Finance Approval** →
   - If `needs_correction == true` → Loop to Task step
   - If completed → Continue to CEO
4. **CEO Approval** → Final decision
5. **End** → Send appropriate notification

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control**: Granular permissions per role
- **CORS Configuration**: Configured for frontend-backend communication
- **Password Validation**: Strong password requirements
- **Input Validation**: DRF serializers with comprehensive validation

---

## 📝 Configuration

### Environment Variables

```env
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://user:password@localhost:5432/workflow_db

# Email Settings
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@example.com
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- Django REST Framework
- Simple JWT
- React
- Tailwind CSS

---

**Built with ❤️ using Django and React**
