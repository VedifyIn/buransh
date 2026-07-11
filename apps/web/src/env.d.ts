/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    db: import('@vedify/db-adapters').DatabaseProvider;
  }
}
