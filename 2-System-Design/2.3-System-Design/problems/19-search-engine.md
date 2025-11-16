# Design Search Engine

## Problem Statement

Design a search engine like Google that crawls, indexes, and ranks billions of web pages with sub-second query latency.

## Key Components

1. **Web Crawler**: Download pages (see Web Crawler problem)
2. **Indexer**: Build inverted index
3. **Ranker**: PageRank algorithm
4. **Query Processor**: Fast retrieval

## Inverted Index

```python
# Document: "the quick brown fox"
# Inverted index:
{
  'the': [doc1, doc5, doc9],
  'quick': [doc1, doc3],
  'brown': [doc1],
  'fox': [doc1, doc8]
}

# Search "quick fox":
# Intersection of posting lists: [doc1, doc3] ∩ [doc1, doc8] = [doc1]
```

## PageRank

```python
def page_rank(graph, iterations=20, damping=0.85):
    """
    PR(A) = (1-d) + d × Σ(PR(B) / OutLinks(B))
    where B links to A
    """
    n = len(graph.nodes)
    ranks = {node: 1/n for node in graph.nodes}

    for _ in range(iterations):
        new_ranks = {}

        for node in graph.nodes:
            # Base rank
            rank = (1 - damping) / n

            # Add contributed rank from inbound links
            for in_node in graph.get_inbound(node):
                out_links = len(graph.get_outbound(in_node))
                rank += damping * ranks[in_node] / out_links

            new_ranks[node] = rank

        ranks = new_ranks

    return ranks
```

## Query Processing

```sql
-- Elasticsearch query
GET /web_pages/_search
{
  "query": {
    "multi_match": {
      "query": "machine learning tutorial",
      "fields": ["title^3", "content", "headings^2"]
    }
  },
  "size": 10,
  "sort": [
    {"page_rank": "desc"},
    "_score"
  ]
}
```

## Scaling

- **Distributed Index**: Shard by term hash
- **Replicas**: 3x replication for availability
- **Caching**: Cache popular queries
- **CDN**: Serve static search page

## Interview Talking Points

"Search engine needs crawler (billions of pages), inverted index (term → doc IDs), and ranking (PageRank + relevance). Use Elasticsearch for distributed indexing with sharding. Rank by combination of PageRank (link authority) and TF-IDF (relevance). Cache popular queries. For scale, shard index by term and replicate 3x."
