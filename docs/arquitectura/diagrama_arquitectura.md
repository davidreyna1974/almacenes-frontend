# Diagrama de arquitectura — Frontend

> Diagramas en [Mermaid](https://mermaid.js.org/) (se renderizan automáticamente en GitHub).

## Vista de capas (sistema completo)

```mermaid
flowchart TB
    subgraph Cliente["🖥️ Frontend — Angular 21"]
        UI["Componentes (modules)"]
        CORE["core: auth · layout · interceptores · guards"]
        SVC["Servicios HTTP (RxJS)"]
        UI --> SVC
        CORE --> SVC
    end
    subgraph API["⚙️ Backend — Spring Boot 3"]
        CTRL["Controllers REST"]
        SEC["Spring Security (JWT + RBAC)"]
        BIZ["Services (lógica de negocio)"]
        REPO["Repositories (JPA)"]
        CTRL --> SEC --> BIZ --> REPO
    end
    DB[("🗄️ PostgreSQL")]
    SVC -- "HTTPS + JWT<br/>/api/v1" --> CTRL
    REPO --> DB
```

## Estructura interna del frontend

```mermaid
flowchart LR
    subgraph core
        AUTH["auth<br/>service · guard<br/>jwt.interceptor · error.interceptor"]
        LAYOUT["layout<br/>sidebar · topbar · main-layout"]
        SHARED["shared<br/>models · components · pipes"]
        DATE["core/date<br/>DdMmYyyyDateAdapter"]
    end
    subgraph modules
        M1["auth<br/>(login · perfil · usuarios)"]
        M2["inventory"]
        M3["purchases"]
        M4["sales"]
        M5["reports"]
    end
    modules --> core
```

## Flujo de autenticación y autorización

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant G as authGuard
    participant API as Backend
    U->>FE: login (usuario/contraseña)
    FE->>API: POST /auth/login
    API-->>FE: JWT (roles)
    FE->>FE: guarda JWT en localStorage
    U->>FE: navega a /reports/executive
    FE->>G: canActivate(data.roles)
    alt rol autorizado
        G-->>FE: permite
        FE->>API: GET /reports/... (Bearer JWT)
        API-->>FE: 200 datos
    else rol no autorizado
        G-->>FE: redirige a /access-denied
    end
```

## Máquinas de estado (negocio)

```mermaid
flowchart LR
    subgraph Compras
        P1[PENDING] --> P2[APPROVED] --> P3[RECEIVED]
        P1 --> P4[CANCELLED]
        P2 --> P4
    end
    subgraph Ventas
        S1[PENDING] --> S2[APPROVED] --> S3[DELIVERED]
        S1 --> S4[CANCELLED]
        S2 --> S4
    end
```
