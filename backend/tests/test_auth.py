import pytest


def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "nuevo@test.co",
        "password": "secret123",
        "nombre": "Usuario Test",
    })
    assert res.status_code == 201
    body = res.json()
    assert body["email"] == "nuevo@test.co"
    assert body["nombre"] == "Usuario Test"
    assert "hashed_password" not in body


def test_register_duplicate_email(client):
    payload = {"email": "dup@test.co", "password": "secret123", "nombre": "Dup"}
    client.post("/api/v1/auth/register", json=payload)
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409


def test_login_success(client):
    client.post("/api/v1/auth/register", json={
        "email": "login@test.co", "password": "pass1234", "nombre": "Login User",
    })
    res = client.post("/api/v1/auth/login", data={
        "username": "login@test.co", "password": "pass1234",
    })
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "wrong@test.co", "password": "correct", "nombre": "Wrong",
    })
    res = client.post("/api/v1/auth/login", data={
        "username": "wrong@test.co", "password": "incorrect",
    })
    assert res.status_code == 401


def test_login_unknown_user(client):
    res = client.post("/api/v1/auth/login", data={
        "username": "noexiste@test.co", "password": "cualquiera",
    })
    assert res.status_code == 401


def test_me_with_valid_token(client):
    client.post("/api/v1/auth/register", json={
        "email": "me@test.co", "password": "pass1234", "nombre": "Me User",
    })
    login = client.post("/api/v1/auth/login", data={
        "username": "me@test.co", "password": "pass1234",
    })
    token = login.json()["access_token"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@test.co"


def test_me_without_token(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_me_with_invalid_token(client):
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer tokenbasura"})
    assert res.status_code == 401
