#!/usr/bin/env python3
"""RabbitMQ Queue Monitoring Script"""

import requests
from requests.auth import HTTPBasicAuth
import json

RABBITMQ_API = 'http://localhost:15672/api'
AUTH = HTTPBasicAuth('admin', 'admin123')

def get_overview():
    """Get cluster overview"""
    resp = requests.get(f'{RABBITMQ_API}/overview', auth=AUTH)
    data = resp.json()
    print(f"\n📊 RabbitMQ Overview")
    print(f"{'='*60}")
    print(f"Version: {data['rabbitmq_version']}")
    print(f"Messages: {data['queue_totals'].get('messages', 0)}")
    print(f"Messages Ready: {data['queue_totals'].get('messages_ready', 0)}")
    print(f"Messages Unacked: {data['queue_totals'].get('messages_unacknowledged', 0)}")

def get_queues():
    """List all queues with metrics"""
    resp = requests.get(f'{RABBITMQ_API}/queues', auth=AUTH)
    queues = resp.json()
    print(f"\n📋 Queue Details")
    print(f"{'='*60}")
    for q in queues:
        print(f"\nQueue: {q['name']}")
        print(f"  Messages: {q.get('messages', 0)}")
        print(f"  Ready: {q.get('messages_ready', 0)}")
        print(f"  Unacked: {q.get('messages_unacknowledged', 0)}")
        print(f"  Consumers: {q.get('consumers', 0)}")
        print(f"  State: {q.get('state', 'N/A')}")

def get_connections():
    """List active connections"""
    resp = requests.get(f'{RABBITMQ_API}/connections', auth=AUTH)
    connections = resp.json()
    print(f"\n🔗 Active Connections: {len(connections)}")

if __name__ == '__main__':
    try:
        get_overview()
        get_queues()
        get_connections()
    except Exception as e:
        print(f"✗ Error: {e}")
