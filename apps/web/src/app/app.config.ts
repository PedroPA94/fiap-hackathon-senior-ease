import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { repositoryProviders } from './infrastructure/providers/repository.providers';
import { serviceProviders } from './infrastructure/providers/service.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...repositoryProviders,
    ...serviceProviders,
  ],
};
