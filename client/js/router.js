// Simple Client-Side Router

class Router {
  constructor() {
    this.routes = {
    };
    this.currentRoute = null;
    
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    
    // Parse query params
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value);
      });
    }

    // Parse path params (e.g., /sets/:id)
    let handler = this.routes[path];
    let pathParams = {};

    if (!handler) {
      for (const routePath in this.routes) {
        const routeParts = routePath.split('/');
        const pathParts = path.split('/');

        if (routeParts.length === pathParts.length) {
          let match = true;
          pathParams = {};

          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
              pathParams[routeParts[i].slice(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
              match = false;
              break;
            }
          }

          if (match) {
            handler = this.routes[routePath];
            break;
          }
        }
      }
    }

    if (handler) {
      this.currentRoute = path;
      handler({ ...params, ...pathParams });
    } else {
      // 404 - redirect to home or login
      this.navigate('/');
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

export const router = new Router();
