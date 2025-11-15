# Networking Cheatsheet - Quick Reference

OSI Model, TCP/IP, HTTP, protocols, and network concepts for interviews.

---

## OSI Model

```
7. APPLICATION    │ HTTP, HTTPS, FTP, SMTP, DNS
   ─────────────────────────────────────────────
6. PRESENTATION   │ SSL/TLS, Encryption, Compression
   ─────────────────────────────────────────────
5. SESSION        │ Authentication, Session Management
   ─────────────────────────────────────────────
4. TRANSPORT      │ TCP, UDP, Port Numbers
   ─────────────────────────────────────────────
3. NETWORK        │ IP, Routing, ICMP
   ─────────────────────────────────────────────
2. DATA LINK      │ MAC, Switches, Ethernet
   ─────────────────────────────────────────────
1. PHYSICAL       │ Cables, Hubs, Signals
```

## TCP/IP Model

```
4. APPLICATION    │ HTTP, DNS, FTP, SMTP
   ─────────────────────────────────────
3. TRANSPORT      │ TCP, UDP
   ─────────────────────────────────────
2. INTERNET       │ IP, ICMP, Routing
   ─────────────────────────────────────
1. NETWORK ACCESS │ Ethernet, WiFi, ARP
```

---

## TCP vs UDP

```
TCP (Transmission Control Protocol):
✓ Connection-oriented
✓ Reliable delivery
✓ Ordered packets
✓ Flow control
✓ Error checking
✗ Slower
Use: HTTP, HTTPS, FTP, SSH, Email

UDP (User Datagram Protocol):
✓ Connectionless
✓ Fast
✗ No reliability guarantee
✗ No ordering
✗ No error recovery
Use: DNS, DHCP, Streaming, Gaming
```

## HTTP Status Codes

```
1xx - Informational
100 Continue
101 Switching Protocols

2xx - Success
200 OK
201 Created
204 No Content

3xx - Redirection
301 Moved Permanently
302 Found (Temporary Redirect)
304 Not Modified

4xx - Client Error
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
429 Too Many Requests

5xx - Server Error
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

## Common Ports

```
20/21  FTP
22     SSH
23     Telnet
25     SMTP
53     DNS
80     HTTP
110    POP3
143    IMAP
443    HTTPS
3306   MySQL
5432   PostgreSQL
6379   Redis
27017  MongoDB
3000   Node.js (dev)
8080   HTTP Alt
```

---

**Last updated:** 2025-11-15
