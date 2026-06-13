// CI pipeline for the Fleet ELD Trip Planner Django backend (in backend/).
// Same docker build/run shape as the kuandorwear pipeline.
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE = 'fleet-eld-backend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building commit ${env.GIT_COMMIT ?: 'local'}"
            }
        }

        stage('Build image') {
            steps {
                // Build context is backend/ (where the Dockerfile + Django code live).
                sh 'docker build -t $IMAGE:${BUILD_NUMBER} -t $IMAGE:latest backend/'
            }
        }

        stage('Lint') {
            steps {
                sh '''docker run --rm $IMAGE:${BUILD_NUMBER} \
                        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics'''
                sh '''docker run --rm $IMAGE:${BUILD_NUMBER} \
                        flake8 . --count --exit-zero --statistics'''
            }
        }

        stage('Test') {
            steps {
                // Settings has a dev SECRET_KEY default and no .env in the image,
                // so no env vars are needed -> SQLite fallback.
                sh '''docker run --rm $IMAGE:${BUILD_NUMBER} \
                        sh -c "coverage run --source=trip_planner,eld_project manage.py test --verbosity=2 && coverage report"'''
            }
        }

        stage('Build artifact') {
            steps {
                sh 'docker save $IMAGE:${BUILD_NUMBER} | gzip > fleet-eld-backend-${BUILD_NUMBER}.tar.gz'
                archiveArtifacts artifacts: 'fleet-eld-backend-*.tar.gz'
            }
        }
    }

    post {
        success { echo 'Pipeline green: image built, lint clean, tests passed, image archived.' }
        failure { echo 'Pipeline failed: check the first red stage above.' }
    }
}
