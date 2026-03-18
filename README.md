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
| **Frontend** | React  |
| **UI Framework** | Tailwind CSS |
| **Database** | PostgreSQL / SQLite (development) |
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

## 📝 Configuration

### Environment Variables

```env
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://user:password@localhost:5432/workflow_db ( Optional )

# Email Settings
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@example.com
```

