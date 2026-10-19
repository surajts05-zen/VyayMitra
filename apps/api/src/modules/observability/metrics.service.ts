import { Injectable } from '@nestjs/common';

interface RequestMetric {
  count: number;
  durationSecondsTotal: number;
}

const UUID_SEGMENT = /\/[0-9a-f]{8}-[0-9a-f-]{27,36}(?=\/|$)/gi;
const LONG_TOKEN_SEGMENT = /\/[A-Za-z0-9_-]{20,}(?=\/|$)/g;
const NUMBER_SEGMENT = /\/\d+(?=\/|$)/g;

export function normalizeMetricRoute(rawPath: string): string {
  const path = rawPath.split('?')[0] || '/';
  return path
    .replace(UUID_SEGMENT, '/:id')
    .replace(LONG_TOKEN_SEGMENT, '/:token')
    .replace(NUMBER_SEGMENT, '/:id')
    .slice(0, 160);
}

@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now();
  private readonly requests = new Map<string, RequestMetric>();
  private inFlight = 0;
  private readonly maxSeries = 250;

  startRequest(): () => void {
    this.inFlight += 1;
    let completed = false;
    return () => {
      if (completed) return;
      completed = true;
      this.inFlight = Math.max(0, this.inFlight - 1);
    };
  }

  observe(method: string, rawPath: string, statusCode: number, durationMs: number): void {
    const route = normalizeMetricRoute(rawPath);
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    let key = `${method.toUpperCase()}|${route}|${statusClass}`;
    if (!this.requests.has(key) && this.requests.size >= this.maxSeries) {
      key = `${method.toUpperCase()}|/__other__|${statusClass}`;
    }
    const metric = this.requests.get(key) || { count: 0, durationSecondsTotal: 0 };
    metric.count += 1;
    metric.durationSecondsTotal += Math.max(0, durationMs) / 1000;
    this.requests.set(key, metric);
  }

  renderPrometheus(): string {
    const lines = [
      '# HELP vyaymitra_process_uptime_seconds Process uptime in seconds.',
      '# TYPE vyaymitra_process_uptime_seconds gauge',
      `vyaymitra_process_uptime_seconds ${Math.floor((Date.now() - this.startedAt) / 1000)}`,
      '# HELP vyaymitra_http_requests_in_flight Current HTTP requests being processed.',
      '# TYPE vyaymitra_http_requests_in_flight gauge',
      `vyaymitra_http_requests_in_flight ${this.inFlight}`,
      '# HELP vyaymitra_http_requests_total Completed HTTP requests.',
      '# TYPE vyaymitra_http_requests_total counter',
    ];

    for (const [key, metric] of Array.from(this.requests.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const [method, route, statusClass] = key.split('|');
      const labels = `method="${method}",route="${route}",status_class="${statusClass}"`;
      lines.push(`vyaymitra_http_requests_total{${labels}} ${metric.count}`);
      lines.push(`vyaymitra_http_request_duration_seconds_sum{${labels}} ${metric.durationSecondsTotal.toFixed(6)}`);
      lines.push(`vyaymitra_http_request_duration_seconds_count{${labels}} ${metric.count}`);
    }

    return `${lines.join('\n')}\n`;
  }
}

