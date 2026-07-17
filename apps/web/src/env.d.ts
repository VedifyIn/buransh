/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    db: import('@vedify/db-adapters').DatabaseProvider;
    anonId: string;
    userId: string | undefined;
  }
}
