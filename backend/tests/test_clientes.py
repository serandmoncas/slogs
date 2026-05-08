import pytest


def _get_token(client) -> str:
    client.post("/api/v1/auth/register", json={
        "email": "tester_c@test.co", "password": "pass1234", "nombre": "Tester",
    })
    res = client.post("/api/v1/auth/login", data={"username": "tester_c@test.co", "password": "pass1234"})
    return res.json()["access_token"]


def _auth(token): return {"Authorization": f"Bearer {token}"}


def _cliente_payload(nit="900000001-1"):
    return {
        "nombre": "Empresa Test", "nit": nit, "email": "empresa@test.co",
        "telefono": "3101234567", "direccion": "Cra 1 #1-1", "ciudad": "Bogotá",
    }


def test_list_empty(client):
    token = _get_token(client)
    res = client.get("/api/v1/clientes", headers=_auth(token))
    assert res.status_code == 200
    body = res.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 1


def test_create_cliente(client):
    token = _get_token(client)
    res = client.post("/api/v1/clientes", json=_cliente_payload(), headers=_auth(token))
    assert res.status_code == 201
    assert res.json()["nit"] == "900000001-1"


def test_create_duplicate_nit(client):
    token = _get_token(client)
    client.post("/api/v1/clientes", json=_cliente_payload(), headers=_auth(token))
    res = client.post("/api/v1/clientes", json=_cliente_payload(), headers=_auth(token))
    assert res.status_code == 409


def test_get_cliente(client):
    token = _get_token(client)
    created = client.post("/api/v1/clientes", json=_cliente_payload(), headers=_auth(token)).json()
    res = client.get(f"/api/v1/clientes/{created['id']}", headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


def test_get_cliente_not_found(client):
    token = _get_token(client)
    res = client.get("/api/v1/clientes/99999", headers=_auth(token))
    assert res.status_code == 404


def test_update_cliente(client):
    token = _get_token(client)
    created = client.post("/api/v1/clientes", json=_cliente_payload(), headers=_auth(token)).json()
    res = client.put(f"/api/v1/clientes/{created['id']}", json={"ciudad": "Medellín"}, headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["ciudad"] == "Medellín"


def test_update_cliente_not_found(client):
    token = _get_token(client)
    res = client.put("/api/v1/clientes/99999", json={"ciudad": "Cali"}, headers=_auth(token))
    assert res.status_code == 404


def test_delete_cliente(admin_client):
    created = admin_client.post("/api/v1/clientes", json=_cliente_payload()).json()
    res = admin_client.delete(f"/api/v1/clientes/{created['id']}")
    assert res.status_code == 204
    res2 = admin_client.get(f"/api/v1/clientes/{created['id']}")
    assert res2.status_code == 404


def test_delete_cliente_requiere_admin(client):
    token = _get_token(client)
    created = client.post("/api/v1/clientes", json=_cliente_payload("NIT-PERM-001"), headers=_auth(token)).json()
    res = client.delete(f"/api/v1/clientes/{created['id']}", headers=_auth(token))
    assert res.status_code == 403


def test_delete_cliente_not_found(admin_client):
    res = admin_client.delete("/api/v1/clientes/99999")
    assert res.status_code == 404


def test_list_with_search(client):
    token = _get_token(client)
    client.post("/api/v1/clientes", json=_cliente_payload("111-1"), headers=_auth(token))
    client.post("/api/v1/clientes", json={**_cliente_payload("222-2"), "nombre": "Otra Empresa", "ciudad": "Cali"}, headers=_auth(token))

    res = client.get("/api/v1/clientes?q=Otra", headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["nombre"] == "Otra Empresa"


def test_list_pagination(client):
    token = _get_token(client)
    for i in range(5):
        client.post("/api/v1/clientes", json=_cliente_payload(f"NIT-{i:03}"), headers=_auth(token))

    res = client.get("/api/v1/clientes?page=1&size=2", headers=_auth(token))
    assert res.status_code == 200
    body = res.json()
    assert len(body["items"]) == 2
    assert body["size"] == 2


def test_requires_auth(client):
    res = client.get("/api/v1/clientes")
    assert res.status_code == 401
