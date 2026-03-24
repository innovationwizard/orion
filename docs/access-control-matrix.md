# Orion Access Control Matrix

> **Auto-generated** from `src/lib/permissions.ts` on 2026-03-24.
> Do not edit manually. Run `npx tsx scripts/generate-access-matrix.ts` to regenerate.

| Resource | Action | master | torredecontrol | gerencia | financiero | contabilidad | marketing | inventario | ventas |
| -------- | ------ | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| reservations | view | ✓ | ✓ |  |  |  |  |  |  |
| reservations | confirm | ✓ | ✓ |  |  |  |  |  |  |
| reservations | reject | ✓ | ✓ |  |  |  |  |  |  |
| reservations | desist | ✓ | ✓ |  |  |  |  |  |  |
| reservations | release_freeze | ✓ | ✓ |  |  |  |  |  |  |
| reservations | update | ✓ | ✓ |  |  |  |  |  |  |
| reservation_clients | update | ✓ | ✓ |  |  |  |  |  |  |
| sales | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| sales | create | ✓ | ✓ |  |  |  |  |  |  |
| sales | update | ✓ | ✓ |  |  |  |  |  |  |
| sales | confirm_rate | ✓ |  |  | ✓ |  |  |  |  |
| payments | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| payments | create | ✓ | ✓ |  |  |  |  |  |  |
| commissions | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| commission_rates | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| commission_phases | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| projects | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| projects | create | ✓ | ✓ |  |  |  |  |  |  |
| projects | update | ✓ | ✓ |  |  |  |  |  |  |
| projects | delete | ✓ | ✓ |  |  |  |  |  |  |
| clients | view | ✓ | ✓ |  |  |  |  |  |  |
| clients | update | ✓ | ✓ |  |  |  |  |  |  |
| salespeople | view | ✓ | ✓ |  |  |  |  |  |  |
| salespeople | invite | ✓ | ✓ |  |  |  |  |  |  |
| salespeople | assign_project | ✓ | ✓ |  |  |  |  |  |  |
| salespeople | send_password_link | ✓ | ✓ |  |  |  |  |  |  |
| settings | view | ✓ | ✓ |  |  |  |  |  |  |
| settings | update | ✓ | ✓ |  |  |  |  |  |  |
| documents | view | ✓ | ✓ |  |  |  |  |  |  |
| documents | update | ✓ | ✓ |  |  |  |  |  |  |
| documents | delete | ✓ | ✓ |  |  |  |  |  |  |
| referidos | view | ✓ | ✓ |  |  |  |  |  |  |
| referidos | create | ✓ | ✓ |  |  |  |  |  |  |
| referidos | update | ✓ | ✓ |  |  |  |  |  |  |
| referidos | delete | ✓ | ✓ |  |  |  |  |  |  |
| valorizacion | view | ✓ | ✓ |  |  |  |  |  |  |
| valorizacion | create | ✓ | ✓ |  |  |  |  |  |  |
| valorizacion | update | ✓ | ✓ |  |  |  |  |  |  |
| valorizacion | delete | ✓ | ✓ |  |  |  |  |  |  |
| cesion | view | ✓ | ✓ |  |  |  |  |  |  |
| buyer_persona | view | ✓ | ✓ |  |  |  |  |  |  |
| buyer_persona | update | ✓ | ✓ |  |  |  |  |  |  |
| integracion | view | ✓ | ✓ |  |  |  |  |  |  |
| management_roles | view | ✓ |  |  |  |  |  |  |  |
| management_roles | create | ✓ |  |  |  |  |  |  |  |
| management_roles | update | ✓ |  |  |  |  |  |  |  |
| audit_log | view | ✓ | ✓ |  |  |  |  |  |  |
| creditos | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| analytics | view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |
| lead_sources | view | ✓ | ✓ |  |  |  | ✓ |  |  |
| lead_sources | create | ✓ | ✓ |  |  |  | ✓ |  |  |
| lead_sources | update | ✓ | ✓ |  |  |  | ✓ |  |  |
| lead_sources | delete | ✓ | ✓ |  |  |  | ✓ |  |  |

---

## Summary

- **Resources:** 23
- **Permission triples (resource × action):** 53
- **Total role grants:** 139
- **Roles defined:** 8 (master, torredecontrol, gerencia, financiero, contabilidad, marketing, inventario, ventas)
