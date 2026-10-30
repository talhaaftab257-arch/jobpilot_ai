from fastapi.testclient import TestClient
from backend.app.main import app

def check():
    client = TestClient(app)
    res = client.get('/api/v1/jobs?min_score=75')
    print('HTTP Status (min_score=75):', res.status_code)
    jobs = res.json()
    print(f'Retrieved {len(jobs)} qualified jobs (Score >= 75):')
    for j in jobs[:5]:
        score = j['match']['overall_score'] if j.get('match') else 'N/A'
        print(f"- [{j.get('region_code')}] {j['title']} at {j['company_name']} (Score: {score}/100)")

if __name__ == '__main__':
    check()
