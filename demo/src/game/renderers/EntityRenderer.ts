import { gl } from '../GL';
import { Entity } from '../Entity';
import { RawModel } from '../graphics/RawModel';
import { TexturedModel } from '../graphics/TexturedModel';
import { ModelTypes } from '../graphics/ModelTypes';
import { Light } from '../graphics/Light';
import { mat4, vec3, glMatrix } from 'gl-matrix';
import { Camera } from '../graphics/Camera';

interface IRenderContext {
	model: RawModel,
	light: Light
}

export class EntityRenderer {
	public static readonly FOV:number = 60;
	public static readonly NEAR_PLANE:number = 0.1;
	public static readonly FAR_PLANE:number = 100;

	private static createProjectionMatrix() {
		const aspectRatio = gl.canvas.width / gl.canvas.height;

		const projectionMatrix = mat4.create();
		mat4.perspective(
			projectionMatrix, 
			glMatrix.toRadian(EntityRenderer.FOV), 
			aspectRatio,
			EntityRenderer.NEAR_PLANE,
			EntityRenderer.FAR_PLANE);

		return projectionMatrix;
	}
 
	private static createViewMatrix(camera: Camera) {
		const viewMatrix = mat4.create();
		mat4.lookAt(viewMatrix, camera.position, vec3.fromValues(0, 0, -1), vec3.fromValues(0, 1, 0));
		return viewMatrix;
	}

	public render(model: RawModel | TexturedModel, entities: Entity[], light: Light, camera: Camera) {
		const renderContext = this.start(model, light, camera);
		entities.forEach(entity => this.drawEntity(renderContext, entity));
		this.finish(model);
	}

	private start(model: RawModel | TexturedModel, light: Light, camera: Camera) {
		const modelInfo = model.type === ModelTypes.RawModel ? model : model.getModel();
		const shader = modelInfo.getShader();

		shader.use();
		shader.loadMatrix4("projectionMatrix", EntityRenderer.createProjectionMatrix());
		shader.loadMatrix4("viewMatrix", EntityRenderer.createViewMatrix(camera));
		shader.loadVector("lightPosition", light.position);

		gl.bindVertexArray(modelInfo.getVao());

		if (model.type === ModelTypes.TexturedModel) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, model.getTexture().getTexture());
		}

		return { model: modelInfo, light: light };
	}
	
	private drawEntity(renderContext: IRenderContext, entity: Entity) {
		const shader = renderContext.model.getShader();

		shader.loadMatrix4("transformationMatrix", entity.getTransformationMatrix());
		shader.loadVector("lightColour", renderContext.light.colour);
		
		gl.drawElements(gl.TRIANGLES, renderContext.model.getVertexCount(), gl.UNSIGNED_INT, 0);
	}

	private finish(model: RawModel | TexturedModel) {
		gl.bindVertexArray(null);
	}
}