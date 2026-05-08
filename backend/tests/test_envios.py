from decimal import Decimal

from app.services.envio_maritimo_service import calcular_descuento_maritimo
from app.services.envio_terrestre_service import calcular_descuento_terrestre, calcular_precio_final

# ── Tests de lógica pura (sin BD) ────────────────────────────────────────────


def test_descuento_terrestre_sobre_10():
    assert calcular_descuento_terrestre(11) == Decimal("5.00")
    assert calcular_descuento_terrestre(100) == Decimal("5.00")


def test_descuento_terrestre_sin_descuento():
    assert calcular_descuento_terrestre(10) == Decimal("0.00")
    assert calcular_descuento_terrestre(1) == Decimal("0.00")


def test_descuento_maritimo_sobre_10():
    assert calcular_descuento_maritimo(11) == Decimal("3.00")


def test_descuento_maritimo_sin_descuento():
    assert calcular_descuento_maritimo(10) == Decimal("0.00")


def test_precio_final_con_descuento():
    precio = calcular_precio_final(Decimal("100000"), Decimal("5.00"))
    assert precio == Decimal("95000.00")


def test_precio_final_sin_descuento():
    precio = calcular_precio_final(Decimal("100000"), Decimal("0.00"))
    assert precio == Decimal("100000.00")


def test_precio_final_maritimo_3pct():
    precio = calcular_precio_final(Decimal("1000000"), Decimal("3.00"))
    assert precio == Decimal("970000.00")


# ── Tests de API (con BD) ────────────────────────────────────────────────────


def _token(client) -> str:
    client.post(
        "/api/v1/auth/register",
        json={"email": "e5@test.co", "password": "pass1234", "nombre": "E5"},
    )
    r = client.post("/api/v1/auth/login", data={"username": "e5@test.co", "password": "pass1234"})
    return r.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _seed_maestros(client, token):
    auth = _auth(token)
    c = client.post(
        "/api/v1/clientes",
        json={
            "nombre": "CLI",
            "nit": "TEST-NIT-001",
            "email": "c@t.co",
            "telefono": "3100000000",
            "direccion": "Cra 1",
            "ciudad": "Bogotá",
        },
        headers=auth,
    ).json()
    p = client.post(
        "/api/v1/productos", json={"nombre": "PROD", "categoria": "Test"}, headers=auth
    ).json()
    b = client.post(
        "/api/v1/bodegas",
        json={
            "nombre": "BOD",
            "ciudad": "Bogotá",
            "direccion": "Cll 1",
            "capacidad": 100,
            "tipo": "NACIONAL",
        },
        headers=auth,
    ).json()
    pu = client.post(
        "/api/v1/puertos",
        json={
            "nombre": "PORT",
            "ciudad": "Baq",
            "pais": "Colombia",
            "codigo": "TPRT",
            "tipo": "NACIONAL",
        },
        headers=auth,
    ).json()
    return c["id"], p["id"], b["id"], pu["id"]


def _payload_terrestre(cliente_id, producto_id, bodega_id, guia="TRR9999999", cantidad=5):
    return {
        "numero_guia": guia,
        "cliente_id": cliente_id,
        "producto_id": producto_id,
        "bodega_id": bodega_id,
        "cantidad": cantidad,
        "fecha_entrega": "2026-12-31",
        "precio_envio": "100000.00",
        "placa": "ABC123",
    }


def _payload_maritimo(cliente_id, producto_id, puerto_id, guia="MAR9999999", cantidad=5):
    return {
        "numero_guia": guia,
        "cliente_id": cliente_id,
        "producto_id": producto_id,
        "puerto_id": puerto_id,
        "cantidad": cantidad,
        "fecha_entrega": "2026-12-31",
        "precio_envio": "500000.00",
        "numero_flota": "BCO1234A",
    }


def test_crear_terrestre_sin_descuento(client):
    token = _token(client)
    c, p, b, _ = _seed_maestros(client, token)
    res = client.post(
        "/api/v1/envios/terrestres",
        json=_payload_terrestre(c, p, b, cantidad=5),
        headers=_auth(token),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["descuento_pct"] == "0.00"
    assert body["precio_final"] == "100000.00"


def test_crear_terrestre_con_descuento_5pct(client):
    token = _token(client)
    c, p, b, _ = _seed_maestros(client, token)
    res = client.post(
        "/api/v1/envios/terrestres",
        json=_payload_terrestre(c, p, b, guia="TRR8888888", cantidad=11),
        headers=_auth(token),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["descuento_pct"] == "5.00"
    assert body["precio_final"] == "95000.00"


def test_crear_maritimo_sin_descuento(client):
    token = _token(client)
    c, p, _, pu = _seed_maestros(client, token)
    res = client.post(
        "/api/v1/envios/maritimos",
        json=_payload_maritimo(c, p, pu, cantidad=5),
        headers=_auth(token),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["descuento_pct"] == "0.00"
    assert body["precio_final"] == "500000.00"


def test_crear_maritimo_con_descuento_3pct(client):
    token = _token(client)
    c, p, _, pu = _seed_maestros(client, token)
    res = client.post(
        "/api/v1/envios/maritimos",
        json=_payload_maritimo(c, p, pu, guia="MAR8888888", cantidad=11),
        headers=_auth(token),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["descuento_pct"] == "3.00"
    assert body["precio_final"] == "485000.00"


def test_placa_invalida(client):
    token = _token(client)
    c, p, b, _ = _seed_maestros(client, token)
    payload = _payload_terrestre(c, p, b)
    payload["placa"] = "abc123"  # minúsculas — inválido
    res = client.post("/api/v1/envios/terrestres", json=payload, headers=_auth(token))
    assert res.status_code == 422


def test_numero_flota_invalido(client):
    token = _token(client)
    c, p, _, pu = _seed_maestros(client, token)
    payload = _payload_maritimo(c, p, pu)
    payload["numero_flota"] = "12345678"  # sin letras — inválido
    res = client.post("/api/v1/envios/maritimos", json=payload, headers=_auth(token))
    assert res.status_code == 422


def test_numero_guia_duplicado_terrestre(client):
    token = _token(client)
    c, p, b, _ = _seed_maestros(client, token)
    client.post(
        "/api/v1/envios/terrestres",
        json=_payload_terrestre(c, p, b, guia="DUP0000001"),
        headers=_auth(token),
    )
    res = client.post(
        "/api/v1/envios/terrestres",
        json=_payload_terrestre(c, p, b, guia="DUP0000001"),
        headers=_auth(token),
    )
    assert res.status_code == 409


def test_recalculo_descuento_al_actualizar(client):
    token = _token(client)
    c, p, b, _ = _seed_maestros(client, token)
    envio = client.post(
        "/api/v1/envios/terrestres",
        json=_payload_terrestre(c, p, b, guia="UPD0000001", cantidad=5),
        headers=_auth(token),
    ).json()
    assert envio["descuento_pct"] == "0.00"

    res = client.put(
        f"/api/v1/envios/terrestres/{envio['id']}", json={"cantidad": 15}, headers=_auth(token)
    )
    assert res.status_code == 200
    body = res.json()
    assert body["descuento_pct"] == "5.00"
    assert body["precio_final"] == "95000.00"


def test_dashboard_stats(client):
    token = _token(client)
    res = client.get("/api/v1/dashboard/stats", headers=_auth(token))
    assert res.status_code == 200
    body = res.json()
    assert "total_envios" in body
    assert "terrestres" in body
    assert "maritimos" in body
    assert "ingresos_mes" in body
    assert "por_estado" in body
